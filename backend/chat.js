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

// ✅ News Routes
app.get('/api/news/apple', (req, res) => {
  const url = `https://newsapi.org/v2/everything?q=apple&from=2025-07-16&to=2025-07-16&sortBy=popularity&apiKey=${NEWS_API_KEY}`;
  fetchNews(url, res);
});
app.get('/api/news/tesla', (req, res) => {
  const url = `https://newsapi.org/v2/everything?q=tesla&from=2025-06-17&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;
  fetchNews(url, res);
});
app.get('/api/news/us-business', (req, res) => {
  const url = `https://newsapi.org/v2/top-headlines?country=us&category=business&apiKey=${NEWS_API_KEY}`;
  fetchNews(url, res);
});
app.get('/api/news/techcrunch', (req, res) => {
  const url = `https://newsapi.org/v2/top-headlines?sources=techcrunch&apiKey=${NEWS_API_KEY}`;
  fetchNews(url, res);
});
app.get('/api/news/wsj', (req, res) => {
  const url = `https://newsapi.org/v2/everything?domains=wsj.com&apiKey=${NEWS_API_KEY}`;
  fetchNews(url, res);
});

// ✅ AI Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model } = req.body;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages,
        model: model || "deepseek/deepseek-r1:free",
        stream: false
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("API call failed:", err);
    res.status(500).json({ error: 'API call failed' });
  }
});

// ✅ Command Parser
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

  // ➕ Add Contact
  const addMatch = lower.match(/add contact (\w+)\s+(\+91\d{10})/i);
  if (addMatch) {
    const [, name, number] = addMatch;
    const contacts = loadContacts();
    contacts[name.toLowerCase()] = number;
    saveContacts(contacts);
    return res.json({ message: `✅ Saved contact: ${name} → ${number}` });
  }

  // 🟢 Open WhatsApp for saved contact
  const openMatch = lower.match(/open whatsapp (\w+)/i);
  if (openMatch) {
    const [, name] = openMatch;
    const contacts = loadContacts();
    const number = contacts[name.toLowerCase()];
    if (number) {
      const whatsappURL = `whatsapp://send?phone=${number}`;
      const command = `start "" "${whatsappURL}"`;

      exec(command, (error) => {
        if (error) {
          // fallback to wa.me
          const fallbackURL = `https://wa.me/${number}`;
          return res.json({
            message: `⚠️ Could not open WhatsApp locally.\n📎 You can manually click here: ${fallbackURL}`
          });
        }
        return res.json({ message: `📲 WhatsApp chat opened for ${name} (${number}).` });
      });
    } else {
      return res.json({
        message: `❌ Contact "${name}" not found.\nUse: add contact ${name} +91XXXXXXXXXX`
      });
    }
    return;
  }

  // 📨 Send Message to Number
  const sendMsgMatch = lower.match(/send\s+the\s+text\s+message\s+"([^"]+)"\s+to\s+number\s+((?:\+?\d[\d\s\-().]*){10,})/i);
  if (sendMsgMatch) {
    const message = encodeURIComponent(sendMsgMatch[1].trim());
    let number = sendMsgMatch[2].replace(/\D/g, '');
    if (number.length < 10) return res.json({ message: `❌ Invalid phone number format.` });

    const whatsappURL = `whatsapp://send?phone=${number}&text=${message}`;
    const command = `start "" "${whatsappURL}"`;
    exec(command, (error) => {
      if (error) return res.json({ message: `❌ Could not open WhatsApp for ${number}` });
      return res.json({ message: `✅ Message ready to send to ${number}: "${decodeURIComponent(message)}".` });
    });
    return;
  }

  // ☎️ Open WhatsApp by number directly
  const phoneMatch = lower.match(/(?:^|\s)(?:open|call)\s+((?:\+?\d[\d\s\-().]*){10,})/i);
  if (phoneMatch) {
    let number = phoneMatch[1].replace(/\D/g, '');
    if (number.length < 10) return res.json({ message: `❌ Invalid phone number format.` });

    const whatsappURL = `whatsapp://send?phone=${number}`;
    const command = `start "" "${whatsappURL}"`;
    exec(command, (error) => {
      if (error) return res.json({ message: `❌ Could not open WhatsApp for ${number}` });
      return res.json({ message: `📞 WhatsApp chat opened for ${number}.` });
    });
    return;
  }

  res.json({ message: "❌ Unknown command." });
});

// ✅ Start Server
app.listen(3000, () => console.log('✅ Server running on http://localhost:3000'));
