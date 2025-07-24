import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';
import { exec } from 'child_process';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const HF_API_KEY = process.env.HF_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const APIFY_API_KEY = process.env.APIFY_API_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;

// Global (or more accurately, server-side persistent) variable to store last scraped URL and content
let lastScrapedData = { url: null, content: null, timestamp: null, status: 'idle' };

const AI_KNOWLEDGE_CUTOFF = "early 2024";

// ======================= FIX APPLIED ===============================
// This function now *only* checks for clearly irrelevant patterns.
// This prevents it from blocking legitimate queries that don't match a specific keyword.
function isClearlyIrrelevant(text) {
  const lowerCaseText = text.toLowerCase();
  const irrelevantPatterns = [
    /weather|temperature/i,
    /friend|dating|relationship/i,
    /cook|recipe|kitchen|food/i, // This will catch the 'biryani' query
    /play|game|movies|music/i,
    /joke|funny|meme/i,
  ];
  return irrelevantPatterns.some(pat => pat.test(lowerCaseText));
}
// ===================== END OF FIX ==================================


// API Endpoint for Real-Time Information (Time)
app.get('/api/time', (req, res) => {
    const now = new Date();
    const options = {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZoneName: 'short'
    };
    const formattedTime = now.toLocaleString('en-IN', options);
    const currentTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    res.json({
        currentTime: formattedTime,
        timeZone: currentTimeZone || "Unknown"
    });
});


app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model, scrape } = req.body;
    const userInput = messages[messages.length - 1]?.content;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = userInput.match(urlRegex);

    const lowerCaseInput = userInput.toLowerCase().trim();

    // --- ALL hardcoded conversational handlers removed from here ---
    // Greetings, Self-Introduction/Help, Acknowledgment, Negative Closures
    // are now expected to be handled by the LLM based on its system prompt and training.


    // 1. Handle Time-related Queries (still specific as it needs external tool)
    if (lowerCaseInput.includes("time") && (lowerCaseInput.includes("current") || lowerCaseInput.includes("what is") || lowerCaseInput.includes("now") || lowerCaseInput.includes("update"))) {
        console.log("⏰ Time query detected. Fetching real-time data.");
        try {
            const timeResponse = await fetch('http://localhost:3000/api/time');
            const timeData = await timeResponse.json();

            const timeContext = `The current date and time is: ${timeData.currentTime} (${timeData.timeZone}).`;
            // Send the context to the AI model to formulate a natural response
            const messagesForAI = [
                messages[0], // Keep the system prompt
                { role: "user", content: `The user asked for the current time. Respond with the following information: ${timeContext}. Keep it concise and friendly.` }
            ];
            
            let aiResponseContent = '⚠️ Could not get a response for time query.';
            if (model === "gemini") {
                const geminiContents = [];
                let lastRole = '';
                for (const msg of messagesForAI) {
                    const roleForGemini = msg.role === 'system' ? 'user' : (msg.role === 'assistant' ? 'model' : msg.role);
                    if (roleForGemini === lastRole && lastRole !== 'system') {
                        geminiContents[geminiContents.length - 1].parts.push({ text: msg.content });
                    } else {
                        geminiContents.push({ role: roleForGemini, parts: [{ text: msg.content }] });
                    }
                    lastRole = roleForGemini;
                }
                const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: geminiContents })
                });
                const geminiData = await geminiResponse.json();
                aiResponseContent = geminiData.candidates?.[0]?.content?.parts[0]?.text || '⚠️ No response from Gemini for time query.';
            } else if (model === "gpt-3.5") {
                const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: "gpt-3.5-turbo",
                        messages: messagesForAI,
                        temperature: 0.7
                    })
                });
                const openaiData = await openaiResponse.json();
                aiResponseContent = openaiData.choices?.[0]?.message?.content || '⚠️ No response from OpenAI for time query.';
            } else { // DeepSeek
                const deepseekResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${HF_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        messages: messagesForAI,
                        model: "deepseek/deepseek-chat",
                        stream: false
                    })
                });
                const deepseekData = await deepseekResponse.json();
                aiResponseContent = deepseekData.choices?.[0]?.message?.content || '⚠️ No response from DeepSeek for time query.';
            }
            return res.json({ choices: [{ message: { content: aiResponseContent } }] });

        } catch (timeError) {
            console.error("❌ Error fetching real-time time:", timeError);
            return res.json({ choices: [{ message: { content: "I'm sorry, I couldn't fetch the current time right now." } }] });
        }
    }

    // 2. Handle Queries for Future/Real-time Knowledge Limitations (still specific)
    const futureOrRealtimeKeywords = ["2025", "2026", "future", "real-time", "live", "up-to-the-minute", "as of now"];
    const hasFutureKeyword = futureOrRealtimeKeywords.some(kw => lowerCaseInput.includes(kw));

    if (hasFutureKeyword && !(scrape || (urls && urls.length > 0))) {
        // This check can remain simple as it's a very specific context.
        return res.json({
            choices: [{
                message: {
                    content: `My knowledge base is based on information up to ${AI_KNOWLEDGE_CUTOFF}. I cannot predict future policies or provide true real-time updates unless that information is available on a specific website you provide for scraping. Would you like me to search for general information on this topic from my existing knowledge?`
                }
            }]
        });
    }
    
    // 3. Handle Contextual Updates after a scrape (still specific)
    const contextualUpdateKeywords = ["update", "news", "current", "latest", "changes"];
    const refersToPreviousSite = lowerCaseInput.includes("this website") || lowerCaseInput.includes("above website") || lowerCaseInput.includes("the site") || lowerCaseInput.includes("the college") || lowerCaseInput.includes("from above");

    if (
        lastScrapedData.url &&
        lastScrapedData.content &&
        contextualUpdateKeywords.some(kw => lowerCaseInput.includes(kw)) &&
        refersToPreviousSite
    ) {
        console.log("🔍 Contextual update query detected for last scraped site.");
        const updateAnalysisPrompt = `The user is asking for updates or new information regarding the content previously scraped from ${lastScrapedData.url}. Analyze the following text and identify any recent news, announcements, events, or changes that could be considered "updates".

        **Important Constraint**: You can only provide information *found within this text*. If the content does not contain clear "updates as of now" or very recent information, please state that based *only* on the text provided. Do not invent real-time access. Focus on educational, institutional, or event-related updates. Limit your response to 400 words.

        Previously Scraped Content:
        """
        ${lastScrapedData.content}
        """`;

        const messagesForAI = [
            messages[0], // System prompt
            { role: "user", content: updateAnalysisPrompt }
        ];

        let aiResponseContent = '⚠️ Could not analyze for updates.';

        if (model === "gemini") {
            const geminiContents = [];
            let lastRole = '';
            for (const msg of messagesForAI) {
                const roleForGemini = msg.role === 'system' ? 'user' : (msg.role === 'assistant' ? 'model' : msg.role);
                if (roleForGemini === lastRole && lastRole !== 'system') {
                    geminiContents[geminiContents.length - 1].parts.push({ text: msg.content });
                    } else {
                    geminiContents.push({ role: roleForGemini, parts: [{ text: msg.content }] });
                }
                lastRole = roleForGemini;
            }
            
            const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: geminiContents })
            });
            const geminiData = await geminiResponse.json();
            aiResponseContent = geminiData.candidates?.[0]?.content?.parts[0]?.text || '⚠️ No response from Gemini API for update analysis.';
        } else if (model === "gpt-3.5") {
            const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: messagesForAI,
                    temperature: 0.7
                })
            });
            const openaiData = await openaiResponse.json();
            aiResponseContent = openaiData.choices?.[0]?.message?.content || '⚠️ No response from OpenAI API for update analysis.';
        } else { // Default to DeepSeek
            const deepseekResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${HF_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: messagesForAI,
                    model: "deepseek/deepseek-chat",
                    stream: false
                })
            });
            const deepseekData = await deepseekResponse.json();
            aiResponseContent = deepseekData.choices?.[0]?.message?.content || '⚠️ No response from DeepSeek API for analysis.';
        }

        return res.json({
            choices: [{ message: { content: `✨ Analyzing the content from ${lastScrapedData.url} for updates:\n\n${aiResponseContent}` } }]
        });
    }


    // 4. Handle Meta-Commands for Previous Output Refining
    const refineOutputPhrases = ["specific", "important", "detail", "details", "summarize", "concise", "extract", "shorten", "elaborate", "explain"];
    const refersToLastOutput = lowerCaseInput.includes("from the above") || lowerCaseInput.includes("this summary") || lowerCaseInput.includes("from your last answer") || lowerCaseInput.includes("the above");

    if (refineOutputPhrases.some(phrase => lowerCaseInput.includes(phrase)) && refersToLastOutput) {
        if (messages.length >= 2) {
            const previousBotReply = messages[messages.length - 2]?.content;

            if (previousBotReply && previousBotReply.length > 50) {
                console.log("🔍 Refining previous output based on user request.");
                const refinementPrompt = `The user has asked to ${lowerCaseInput.replace('from the above', '').replace('this summary', '').replace('from your last answer', '').trim()}. Please refine the following text accordingly, focusing on academic/educational relevance. Keep it concise and impactful.

                Text to refine:
                """
                ${previousBotReply}
                """`;

                const messagesForAI = [
                    messages[0],
                    { role: "user", content: refinementPrompt }
                ];

                let aiResponseContent = '⚠️ Could not refine the previous information.';

                if (model === "gemini") {
                    const geminiContents = [];
                    let lastRole = '';
                    for (const msg of messagesForAI) {
                        const roleForGemini = msg.role === 'system' ? 'user' : (msg.role === 'assistant' ? 'model' : msg.role);
                        if (roleForGemini === lastRole && lastRole !== 'system') {
                            geminiContents[geminiContents.length - 1].parts.push({ text: msg.content });
                        } else {
                            geminiContents.push({ role: roleForGemini, parts: [{ text: msg.content }] });
                        }
                        lastRole = roleForGemini;
                    }
                    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: geminiContents })
                    });
                    const geminiData = await geminiResponse.json();
                    aiResponseContent = geminiData.candidates?.[0]?.content?.parts[0]?.text || '⚠️ No response from Gemini API for refinement.';
                } else if (model === "gpt-3.5") {
                    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${OPENAI_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            model: "gpt-3.5-turbo",
                            messages: messagesForAI,
                            temperature: 0.7
                        })
                    });
                    const openaiData = await openaiResponse.json();
                    aiResponseContent = openaiData.choices?.[0]?.message?.content || '⚠️ No response from OpenAI API for refinement.';
                } else { // DeepSeek
                    const deepseekResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${HF_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            messages: messagesForAI,
                            model: "deepseek/deepseek-chat",
                            stream: false
                        })
                    });
                    const deepseekData = await deepseekResponse.json();
                    aiResponseContent = deepseekData.choices?.[0]?.message?.content || '⚠️ No response from DeepSeek API for refinement.';
                }

                return res.json({
                    choices: [{ message: { content: `✨ Here's the refined information:\n\n${aiResponseContent}` } }]
                });
            }
        }
    }


    // 5. Handle Scraping if a URL is present or explicitly requested
    if (scrape || (urls && urls.length > 0)) {
      console.log("🔗 Scraping triggered");
      const targetUrl = scrape || urls[0];
      let scrapedContent = '';

      try {
        if (APIFY_API_KEY) { // Try Apify first if key is available
            console.log("Attempting Apify scrape...");
            const runResponse = await fetch(`https://api.apify.com/v2/acts/apify~website-content-crawler/runs?token=${APIFY_API_KEY}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                startUrls: [{ url: targetUrl }],
                maxCrawlPages: 5,
                maxCrawlDepth: 2,
              })
            });

            const runData = await runResponse.json();
            if (!runData.data || !runData.data.id) {
              console.error("Apify actor response:", runData);
              throw new Error('Apify actor run failed to start');
            }

            const runId = runData.data.id;
            let status = 'RUNNING';

            let attempts = 0;
            const maxAttempts = 15; // Increased attempts for longer scrapes
            while ((status === 'RUNNING' || status === 'READY') && attempts < maxAttempts) {
              console.log(`⏳ Waiting for Apify run... (Attempt ${attempts + 1}/${maxAttempts})`);
              await new Promise(r => setTimeout(r, 6000)); // Increased wait time
              const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_KEY}`);
              const statusData = await statusResponse.json();
              status = statusData.data.status;
              attempts++;
            }

            if (status !== 'SUCCEEDED') {
                throw new Error(`Apify scraping did not succeed. Status: ${status}`);
            }
            
            const datasetResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY_API_KEY}`);
            const datasetItems = await datasetResponse.json();

            scrapedContent = datasetItems.map(item => item.text || '').join('\n\n').slice(0, 8000); // Increased content limit
            console.log("✅ Apify scrape successful.");

        } else {
            throw new Error("APIFY_API_KEY not configured. Falling back to direct fetch.");
        }
      } catch (apifyError) {
        console.warn("⚠️ Apify failed or not configured, falling back to direct fetch:", apifyError.message);

        const fallbackResponse = await fetch(targetUrl, {
          method: 'GET',
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const html = await fallbackResponse.text();

        scrapedContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 5000);
        console.log("✅ Fallback direct fetch successful.");
      }

      // Store the last scraped data for contextual follow-ups
      lastScrapedData = {
          url: targetUrl,
          content: scrapedContent,
          timestamp: new Date()
      };

      // Send scraped content to the AI model for initial summary
      if (scrapedContent) {
        console.log("Sending scraped content to AI for initial summary...");

        const analysisPrompt = `The following content was scraped from ${targetUrl}. Please analyze it and provide a concise, structured summary focusing on academic, educational, and institutional details relevant to a student or counselor. Include information about courses, admissions, fees, faculty, facilities, or any other relevant details for international study, if available. Prioritize clear, bulleted lists or short paragraphs for readability. If the content is not clearly academic or related to study abroad, state that. Limit your response to 500 words.

        Scraped Content:
        """
        ${scrapedContent}
        """`;

        const messagesForAI = [
            messages[0], // System prompt
            { role: "user", content: analysisPrompt }
        ];

        let aiResponseContent = '⚠️ Could not analyze scraped content.';

        if (model === "gemini") {
            const geminiContents = [];
            let lastRole = '';
            for (const msg of messagesForAI) {
                const roleForGemini = msg.role === 'system' ? 'user' : (msg.role === 'assistant' ? 'model' : msg.role);
                if (roleForGemini === lastRole && lastRole !== 'system') {
                    geminiContents[geminiContents.length - 1].parts.push({ text: msg.content });
                } else {
                    geminiContents.push({ role: roleForGemini, parts: [{ text: msg.content }] });
                }
                lastRole = roleForGemini;
            }
            
            const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: geminiContents })
            });
            const geminiData = await geminiResponse.json();
            aiResponseContent = geminiData.candidates?.[0]?.content?.parts[0]?.text || '⚠️ No response from Gemini API for analysis.';
        } else if (model === "gpt-3.5") {
            const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: messagesForAI,
                    temperature: 0.7
                })
            });
            const openaiData = await openaiResponse.json();
            aiResponseContent = openaiData.choices?.[0]?.message?.content || '⚠️ No response from OpenAI API for analysis.';
        } else { // Default to DeepSeek
            const deepseekResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${HF_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: messagesForAI,
                    model: "deepseek/deepseek-chat",
                    stream: false
                })
            });
            const deepseekData = await deepseekResponse.json();
            aiResponseContent = deepseekData.choices?.[0]?.message?.content || '⚠️ No response from DeepSeek API for analysis.';
        }

        return res.json({
          choices: [{ message: { content: `✨ Here's a summary of the content from ${targetUrl}:\n\n${aiResponseContent}` } }]
        });

      } else {
          // *** ENHANCED ERROR MESSAGE IMPLEMENTATION ***
          return res.json({
              choices: [{ message: { content: `I'm sorry, I couldn't retrieve any content from ${targetUrl}. 😔

This can sometimes happen if:
* The website has strong anti-scraping measures.
* The page requires a login or has a complex structure.
* The URL is incorrect or the page is empty.

**What you can try:**
Could you please provide a different, more direct link? The main admissions or program page often works best.` } }]
          });
      }
    }

    // ======================= FIX APPLIED ===============================
    // This block now uses the new, more robust isClearlyIrrelevant function
    // to catch off-topic questions while letting everything else through to the AI.
    if (isClearlyIrrelevant(userInput)) {
      console.log("🚫 Detected irrelevant query. Blocking and sending fallback message.");
      return res.json({
        choices: [{
          message: {
            content: "My purpose is to assist with study abroad and academic counseling. I can't help with topics like cooking or the weather. How can I help you with universities, visas, or applications today?"
          }
        }]
      });
    }
    // ======================= END OF FIX ===============================


    // This is the main path for *general academic queries* and also general conversation (greetings, acknowledgments, negative closures, help requests)
    // that require AI processing. The LLM will now handle these contextually.
    if (model === "gemini") {
      console.log("🔗 Using Gemini API for general chat");
      const geminiContents = [];
      let lastRole = '';
      // Correctly format for Gemini: alternate between 'user' and 'model', and handle system prompt
      messages.forEach(msg => {
          const roleForGemini = msg.role === 'system' ? 'user' : (msg.role === 'assistant' ? 'model' : msg.role);
          
          // Gemini API requires roles to alternate. If the last role was the same, merge content.
          if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === roleForGemini) {
              geminiContents[geminiContents.length - 1].parts.push({ text: msg.content });
          } else {
              geminiContents.push({ role: roleForGemini, parts: [{ text: msg.content }] });
          }
      });

      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: geminiContents })
      });

      const geminiData = await geminiResponse.json();
      if (!geminiResponse.ok || geminiData.error) {
        console.error("Gemini API Error:", geminiData.error);
        return res.status(500).json({ error: geminiData.error?.message || 'Gemini API Error' });
      }

      const reply = geminiData.candidates?.[0]?.content?.parts.map(part => part.text).join('') || '⚠️ No response from Gemini API.';
      return res.json({ choices: [{ message: { content: reply } }] });
    }

    if (model === "gpt-3.5") {
      console.log("🔗 Using GPT-3.5 API for general chat");
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages,
          temperature: 0.7
        })
      });

      const openaiData = await openaiResponse.json();
      const reply = openaiData.choices?.[0]?.message?.content || '⚠️ No response from OpenAI API.';
      return res.json({ choices: [{ message: { content: reply } }] });
    }

    // Default to DeepSeek for general chat if no other model matches
    console.log("🔗 Using DeepSeek API for general chat");
    const deepseekResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages,
        model: "deepseek/deepseek-chat",
        stream: false
      })
    });

    const deepseekData = await deepseekResponse.json();
    return res.json(deepseekData);

  } catch (err) {
    console.error("❌ Backend error:", err);
    res.status(500).json({ error: err.message || 'API call failed' });
  }
});

app.listen(3000, () => console.log('✅ Server running on http://localhost:3000'));