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

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model, scrape } = req.body;
    const userInput = messages[messages.length - 1]?.content;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = userInput.match(urlRegex);

    if (scrape || (urls && urls.length > 0)) {
      console.log("🔗 Scraping triggered");
      const targetUrl = scrape || urls[0];

      try {
        // Try Apify actor first
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

        while (status === 'RUNNING' || status === 'READY') {
          console.log('⏳ Waiting for Apify run...');
          await new Promise(r => setTimeout(r, 5000));
          const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_KEY}`);
          const statusData = await statusResponse.json();
          status = statusData.data.status;
        }

        if (status !== 'SUCCEEDED') throw new Error('Apify scraping failed.');

        const datasetId = statusData.data.defaultDatasetId;
        const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_KEY}`);
        const dataset = await datasetResponse.json();

        const scrapedContent = dataset.map(item => item.text || item.url).join('\n\n').slice(0, 2000);
        return res.json({
          choices: [{ message: { content: `📄 Scraped Data from ${targetUrl}:\n\n${scrapedContent}` } }]
        });
      } catch (apifyError) {
        console.warn("⚠️ Apify failed, falling back to direct fetch:", apifyError.message);

        // Fallback: Fetch page directly
        const fallbackResponse = await fetch(targetUrl, {
          method: 'GET',
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const html = await fallbackResponse.text();

        const plainText = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 2000);

        return res.json({
          choices: [{ message: { content: `📄 Fallback Scrape of ${targetUrl}:\n\n${plainText}` } }]
        });
      }
    }

    // Handle normal chat (Gemini, GPT-3.5, DeepSeek)
    if (model === "gemini") {
      console.log("🔗 Using Gemini API");
      const formattedMessages = messages.map(msg => ({
        text: `${msg.role === 'system' ? '[SYSTEM]' : msg.role === 'user' ? '[USER]' : '[ASSISTANT]'}: ${msg.content}`
      }));

      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: formattedMessages }] })
      });
      const geminiData = await geminiResponse.json();
      const reply = geminiData.candidates?.[0]?.content?.parts[0]?.text || '⚠️ No response from Gemini API.';
      return res.json({ choices: [{ message: { content: reply } }] });
    }

    if (model === "gpt-3.5") {
      console.log("🔗 Using GPT-3.5 API");
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
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

    console.log("🔗 Using DeepSeek API");
    const deepseekResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${HF_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, model: "deepseek/deepseek-r1:free", stream: false })
    });
    const deepseekData = await deepseekResponse.json();
    return res.json(deepseekData);

  } catch (err) {
    console.error("❌ Backend error:", err);
    res.status(500).json({ error: err.message || 'API call failed' });
  }
});

app.listen(3000, () => console.log('✅ Server running on http://localhost:3000'));
