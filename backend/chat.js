import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const HF_API_KEY = process.env.HF_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const contactsPath = path.join('./contacts.json');

// 🔹 Load Contacts from JSON
function loadContacts() {
  if (!fs.existsSync(contactsPath)) fs.writeFileSync(contactsPath, '{}');
  return JSON.parse(fs.readFileSync(contactsPath, 'utf8'));
}

function saveContacts(contacts) {
  fs.writeFileSync(contactsPath, JSON.stringify(contacts, null, 2));
}

// 🔸 Mock CRM Data
const mockStudentData = {
  "12345": {
    name: "Ravi",
    status: "Application under review",
    verifiedDocs: ["Passport", "10th Marksheet", "IELTS Score"],
    nextStep: "Awaiting university response"
  },
  "98765": {
    name: "Sneha",
    status: "Documents verified, waiting for payment",
    verifiedDocs: ["Aadhaar", "12th Marksheet"],
    nextStep: "Pay application fee"
  }
};

// ✅ Status Check API
app.get('/api/status/:studentId', (req, res) => {
  const studentId = req.params.studentId;
  const record = mockStudentData[studentId];

  if (!record) return res.status(404).json({ error: "Student not found" });

  const summary = `
Student Name: ${record.name}
Current Status: ${record.status}
Verified Documents: ${record.verifiedDocs.join(', ')}
Next Step: ${record.nextStep}
  `;

  res.json({ summary });
});

// ✅ News Fetch Helper
async function fetchNews(url, res) {
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "ok") {
      return res.status(500).json({ error: "Failed to fetch news" });
    }

    const articles = data.articles.slice(0, 5).map(a => ({
      title: a.title,
      source: a.source.name,
      url: a.url,
      publishedAt: a.publishedAt
    }));

    res.json({ articles });
  } catch (err) {
    console.error("News fetch error:", err);
    res.status(500).json({ error: "News fetch failed" });
  }
}

// ✅ Education & Study Abroad News Routes
app.get('/api/news/education', (req, res) => {
  const url = `https://newsapi.org/v2/everything?q=education+policy+US&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;
  fetchNews(url, res);
});

app.get('/api/news/study-abroad', (req, res) => {
  const url = `https://newsapi.org/v2/everything?q=study+abroad&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;
  fetchNews(url, res);
});

app.get('/api/news/scholarships', (req, res) => {
  const url = `https://newsapi.org/v2/everything?q=scholarships&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;
  fetchNews(url, res);
});

app.get('/api/news/visa-updates', (req, res) => {
  const url = `https://newsapi.org/v2/everything?q=student+visa+updates&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;
  fetchNews(url, res);
});

app.get('/api/news/universities', (req, res) => {
  const url = `https://newsapi.org/v2/everything?q=universities+admissions&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;
  fetchNews(url, res);
});

// ✅ AI Chat Endpoint (DeepSeek + Gemini + GPT-3.5)
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model } = req.body;

    if (model === "gemini") {
      console.log("🔗 Using Google Gemini API");
      const formattedMessages = messages.map(msg => ({
        text: `${msg.role === 'system' ? '[SYSTEM]' : msg.role === 'user' ? '[USER]' : '[ASSISTANT]'}: ${msg.content}`
      }));

      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [ { parts: formattedMessages } ]
        })
      });

      const geminiData = await geminiResponse.json();
      if (!geminiData.candidates || !geminiData.candidates[0]?.content?.parts[0]?.text) {
        console.error("Gemini API error:", geminiData);
        return res.status(500).json({ error: 'No response from Gemini API' });
      }

      const geminiReply = geminiData.candidates[0].content.parts[0].text;
      return res.json({ choices: [ { message: { content: geminiReply } } ] });
    }

    if (model === "gpt-3.5") {
      console.log("🔗 Using OpenAI GPT-3.5 API");
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
      if (!openaiData.choices || !openaiData.choices[0]?.message?.content) {
        console.error("OpenAI API error:", openaiData);
        return res.status(500).json({ error: 'No response from OpenAI API' });
      }

      const openaiReply = openaiData.choices[0].message.content;
      return res.json({ choices: [ { message: { content: openaiReply } } ] });
    }

    // Default to DeepSeek
    console.log("🔗 Using DeepSeek (OpenRouter) API");
    const deepseekResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages,
        model: "deepseek/deepseek-r1:free",
        stream: false
      })
    });

    const deepseekData = await deepseekResponse.json();
    return res.json(deepseekData);

  } catch (err) {
    console.error("API call failed:", err);
    res.status(500).json({ error: 'API call failed' });
  }
});

// ✅ Command Parser (no changes)
app.post('/api/command', (req, res) => {
  const { query } = req.body;
  const lower = query.toLowerCase().trim();

  const commands = {
    "open notepad": "notepad",
    "close notepad": "taskkill /IM notepad.exe /F",
    "open calculator": "calc",
    "close calculator": "taskkill /IM calculator.exe /F",
    "open chrome": "start chrome",
    "close chrome": "taskkill /IM chrome.exe /F",
    "lock screen": "rundll32.exe user32.dll,LockWorkStation",
    "shutdown": "shutdown /s /t 1",
    "restart": "shutdown /r /t 1",
    "open whatsapp": "start whatsapp://",
    "open camera": "start microsoft.windows.camera:",
    "close camera": "taskkill /IM WindowsCamera.exe /F"
  };

  for (const key in commands) {
    if (lower === key) {
      exec(commands[key], (error) => {
        if (error) return res.json({ message: "❌ Command failed: " + error.message });
        return res.json({ message: "✅ Executed: " + key });
      });
      return;
    }
  }

  res.json({ message: "❌ Unknown command." });
});

// ✅ Start Server
app.listen(3000, () => console.log('✅ Server running on http://localhost:3000'));
