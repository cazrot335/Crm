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
let lastScrapedData = { url: null, content: null, timestamp: null, status: 'idle' }; // Added status

// Relevance filter
function isRelevantAcademicQuery(text) {
  const lowerCaseText = text.toLowerCase();

  const relevantKeywords = [
    "study abroad", "scholarship", "visa", "university", "universities", "college", "colleges", "application", "tuition",
    "ielts", "toefl", "pte", "gre", "gmat", "sat", "act",
    "living cost", "education", "academic", "foreign education", "culture",
    "international student", "admissions", "course", "program", "programs", "crm", "student counseling",
    "sop", "lor", "intake", "ranking", "credits", "postgraduate", "undergraduate", "degree",
    "masters", "phd", "bachelor", "diploma", "engineering", "humanities", "science", "arts", "business",
    "canada", "usa", "uk", "australia", "germany", "europe", "country", "countries",
    "updates", "news", "current", "latest", "changes", "info", "website", "explain", "about" // Added for meta-queries
  ];

  const irrelevantPatterns = [
    /weather|temperature/i,
    /friend|dating|relationship/i,
    /cook|recipe|kitchen|food/i,
    /play|game|movies|music/i,
    /joke|funny|meme/i,
    /who are you|what are you|how are you|how old are you/i,
    /tell me about yourself/i,
    /chatbot|ai|robot/i
  ];

  const hasRelevantKeyword = relevantKeywords.some(kw => lowerCaseText.includes(kw));
  const hasIrrelevantPattern = irrelevantPatterns.some(pat => pat.test(lowerCaseText));

  return hasRelevantKeyword && !hasIrrelevantPattern;
}

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

    // 1. Handle simple greetings FIRST
    if (["hi", "hello", "hey", "good morning", "good afternoon", "good evening"].includes(lowerCaseInput)) {
      return res.json({
        choices: [{
          message: {
            content: "👋 Hello there! How can I assist you with study abroad or CRM-related queries today?"
          }
        }]
      });
    }

    // 2. Handle Self-Introduction/Help Queries
    const helpPhrases = [
        "how can you help", "how do you assist", "what can you do", "what are your capabilities",
        "tell me about yourself", "how do you work", "what is your purpose",
        "what are you", "who are you", "what else", "what can i ask", "what kind of questions",
        "help me", "assist me", "how can i use you", "what?"
    ];

    const lastBotMessageContent = messages.length > 1 && messages[messages.length - 2]?.role === 'assistant' ? messages[messages.length - 2]?.content : '';
    const isFollowUpToLimitation = lastBotMessageContent.toLowerCase().includes("i’m here to assist with academic") || lastBotMessageContent.toLowerCase().includes("my current tools are limited");
    const isExactRepeatHelpQuery = lowerCaseInput.includes("how can you assist me with") && lastBotMessageContent.includes("🎓 I'm ScholarBot, your AI assistant specialized in");

    if (helpPhrases.some(phrase => lowerCaseInput.includes(phrase)) || isFollowUpToLimitation) {
        if (isExactRepeatHelpQuery) {
            return res.json({
                choices: [{
                    message: {
                        content: "I just explained how I can help! To get specific assistance, please ask me a question about a university, a scholarship, a visa, or paste a website URL to summarize. What's on your mind?"
                    }
                }]
            });
        }
        return res.json({
            choices: [{
                message: {
                    content: "🎓 I'm ScholarBot, your AI assistant specialized in **academic and study abroad guidance**, and **CRM support** for counselors.\n\nHere's how I can help:\n\n" +
                             "**For Students:**\n" +
                             "- Find information on universities, courses, and programs worldwide.\n" +
                             "- Get details on scholarships, visas, and living costs for international study.\n" +
                             "- Understand admission requirements (IELTS, TOEFL, SOP, LOR, etc.).\n" +
                             "- Provide summaries of educational websites (just paste a URL).\n\n" +
                             "**For Counselors:**\n" +
                             "- Assist with student application processes and education updates.\n" +
                             "- Support CRM tasks related to student management.\n\n" +
                             "**To get started, just ask me a question about study abroad, education, or paste a website URL to summarize!**"
                }
            }]
        });
    }


    // 3. Handle Acknowledgment/Continuation Phrases
    const acknowledgmentPhrases = [
        "ok", "okay", "fine", "alright", "got it",
        "thanks", "thank you", "ok thanks", "okay thanks", "fine thanks", "alright thanks",
        "thanks a lot", "thank you so much"
    ];
    if (acknowledgmentPhrases.some(phrase => lowerCaseInput.includes(phrase))) {
        const lastAcademicBotMessage = messages
            .slice(0, -1)
            .reverse()
            .find(msg => msg.role === 'assistant' && msg.content && !msg.content.includes("I’m here to assist with academic") && !msg.content.includes("Could not analyze scraped content."));

        if (lastAcademicBotMessage) {
            let contextPhrase = "the last topic";
            if (lastAcademicBotMessage.content.includes("summary of the content from")) {
                const urlMatch = lastAcademicBotMessage.content.match(/from (https?:\/\/[^\s:]+)/);
                if (urlMatch) contextPhrase = `the content from ${urlMatch[1]}`;
            } else if (lastAcademicBotMessage.content.includes("anticipated areas to check for")) {
                 contextPhrase = `updates for Goa College Of Engineering`;
            } else if (lastAcademicBotMessage.content.includes("Here's a summary of the content from")) {
                 contextPhrase = `the website ${lastScrapedData.url}`;
            } else if (lastAcademicBotMessage.content.includes("current date and time is")) {
                contextPhrase = `the current time`;
            } else if (lastAcademicBotMessage.content.includes("🎓 I'm ScholarBot, your AI assistant specialized in")) {
                contextPhrase = `how I can assist you`;
            }


            return res.json({
                choices: [{
                    message: {
                        content: `You're welcome! Is there anything else you'd like to know about ${contextPhrase} or related academic topics?`
                    }
                }]
            });
        } else {
            return res.json({
                choices: [{
                    content: "Great! How else can I assist you with study abroad or CRM-related questions?"
                }]
            });
        }
    }

    // 4. Handle Negative Closing Phrases
    const negativeClosingPhrases = ["no", "no nothing", "nothing", "that's all", "i'm good", "no thanks", "nothing else"];
    if (negativeClosingPhrases.includes(lowerCaseInput)) {
        return res.json({
            choices: [{
                message: {
                    content: "Alright, no problem! Feel free to ask if anything else comes up regarding academic, study abroad, or counselor-related queries. Have a great day!"
                }
            }]
        });
    }


    // 5. Handle Time-related Queries
    if (lowerCaseInput.includes("time") && (lowerCaseInput.includes("current") || lowerCaseInput.includes("what is") || lowerCaseInput.includes("now") || lowerCaseInput.includes("update"))) {
        console.log("⏰ Time query detected. Fetching real-time data.");
        try {
            const timeResponse = await fetch('http://localhost:3000/api/time');
            const timeData = await timeResponse.json();

            const timeContext = `The current date and time is: ${timeData.currentTime} (${timeData.timeZone}).`;
            const messagesForAI = [
                messages[0],
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
    
    // 6. Handle Contextual Updates after a scrape
    if (
        lastScrapedData.url &&
        lastScrapedData.content &&
        (lowerCaseInput.includes("update") || lowerCaseInput.includes("news") || lowerCaseInput.includes("current") || lowerCaseInput.includes("latest") || lowerCaseInput.includes("changes"))
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
            aiResponseContent = deepseekData.choices?.[0]?.message?.content || '⚠️ No response from DeepSeek API for analysis.';
        }

        return res.json({
            choices: [{ message: { content: `✨ Analyzing the content from ${lastScrapedData.url} for updates:\n\n${aiResponseContent}` } }]
        });
    }


    // 7. Handle Scraping if a URL is present or explicitly requested
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
                input: {
                  startUrls: [{ url: targetUrl }],
                  maxDepth: 1,
                  maxPagesPerCrawl: 3
                }
              })
            });

            const runData = await runResponse.json();
            if (!runData.data || !runData.data.id) {
              console.error("Apify actor response:", runData);
              throw new Error('Apify actor run failed');
            }

            const runId = runData.data.id;
            let status = 'RUNNING';

            let attempts = 0;
            const maxAttempts = 10;
            while ((status === 'RUNNING' || status === 'READY') && attempts < maxAttempts) {
              console.log(`⏳ Waiting for Apify run... (Attempt ${attempts + 1}/${maxAttempts})`);
              await new Promise(r => setTimeout(r, 5000));
              const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_KEY}`);
              const statusData = await statusResponse.json();
              status = statusData.data.status;
              attempts++;
            }

            if (status !== 'SUCCEEDED') {
                throw new Error(`Apify scraping failed or timed out. Status: ${status}`);
            }

            const datasetId = statusData.data.defaultDatasetId;
            const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_KEY}`);
            const dataset = await datasetResponse.json();

            scrapedContent = dataset.map(item => item.text || item.url).join('\n\n').slice(0, 5000);
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
          return res.json({
              choices: [{ message: { content: `⚠️ Could not retrieve any content from ${targetUrl}. It might be un-scrapeable or empty.` } }]
          });
      }
    }

    // 8. If none of the above specific handlers (greeting, acknowledgment, negative closure, help, time, contextual updates, scrape)
    // caught the query, then apply the general academic relevance filter.
    if (!isRelevantAcademicQuery(userInput)) {
      return res.json({
        choices: [{
          message: {
            content: "🤖 I’m here to assist with academic, study abroad, and counselor-related queries only. Please ask something related to education, scholarships, or international study."
          }
        }]
      });
    }

    // This is the main path for *general academic queries* that require AI processing.
    if (model === "gemini") {
      console.log("🔗 Using Gemini API for general chat");
      const formattedMessages = messages.map(msg => ({
        role: msg.role === 'system' ? 'user' : (msg.role === 'assistant' ? 'model' : msg.role),
        parts: [{ text: msg.content }]
      }));

      const geminiContents = [];
      let lastRole = '';
      for (const msg of formattedMessages) {
          if (msg.role === lastRole && lastRole !== 'system') {
              geminiContents[geminiContents.length - 1].parts.push(...msg.parts);
          } else {
              geminiContents.push(msg);
          }
          lastRole = msg.role;
      }

      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: geminiContents })
      });

      const geminiData = await geminiResponse.json();
      if (geminiData.error) {
        console.error("Gemini API Error:", geminiData.error);
        return res.status(geminiResponse.status).json({ error: geminiData.error.message || 'Gemini API Error' });
      }

      const reply = geminiData.candidates?.[0]?.content?.parts[0]?.text || '⚠️ No response from Gemini API.';
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