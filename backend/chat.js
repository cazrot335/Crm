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

// 🔹 Mock CRM Data for Application Status
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

// 🔸 Contacts memory file path
const contactsPath = path.join('./contacts.json');

// 🔹 Load & Save Contacts
function loadContacts() {
  if (!fs.existsSync(contactsPath)) fs.writeFileSync(contactsPath, '{}');
  return JSON.parse(fs.readFileSync(contactsPath, 'utf8'));
}

function saveContacts(contacts) {
  fs.writeFileSync(contactsPath, JSON.stringify(contacts, null, 2));
}

// ✅ GET: Application Status API
app.get('/api/status/:studentId', (req, res) => {
  const studentId = req.params.studentId;
  const record = mockStudentData[studentId];

  if (!record) {
    return res.status(404).json({ error: "Student not found" });
  }

  const summary = `
Student Name: ${record.name}
Current Status: ${record.status}
Verified Documents: ${record.verifiedDocs.join(', ')}
Next Step: ${record.nextStep}
  `;

  res.json({ summary });
});

// ✅ POST: Chatbot AI Endpoint
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

// ✅ POST: Command Endpoint for System + WhatsApp Actions
app.post('/api/command', (req, res) => {
  const { query } = req.body;
  const lower = query.toLowerCase();

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
    if (lower.includes(key)) {
      exec(commands[key], (error) => {
        if (error) return res.json({ message: "❌ Command failed: " + error.message });
        return res.json({ message: "✅ Executed: " + key });
      });
      return;
    }
  }

  // 🔸 Match: send the text message "hello" to number +91...
  const sendMsgMatch = lower.match(/send\s+the\s+text\s+message\s+"([^"]+)"\s+to\s+number\s+((?:\+?\d[\d\s\-().]*){10,})/i);
  if (sendMsgMatch) {
    const message = encodeURIComponent(sendMsgMatch[1].trim());
    let number = sendMsgMatch[2].replace(/\D/g, '');
    if (number.length < 10) {
      return res.json({ message: `❌ Invalid phone number format.` });
    }
    const whatsappURL = `whatsapp://send?phone=${number}&text=${message}`;
    const command = `start "" "${whatsappURL}"`;
    exec(command, (error) => {
      if (error) return res.json({ message: `❌ Could not open WhatsApp for ${number}` });
      return res.json({
        message: `✅ Message ready to send to ${number}: "${decodeURIComponent(message)}".`
      });
    });
    return;
  }

  // 🔸 Match: call or open +91 number
  const phoneMatch = lower.match(/(?:^|\s)(?:open|call)\s+((?:\+?\d[\d\s\-().]*){10,})/i);
  if (phoneMatch) {
    let number = phoneMatch[1].replace(/\D/g, '');
    if (number.length < 10) {
      return res.json({ message: `❌ Invalid phone number format.` });
    }
    const whatsappURL = `whatsapp://send?phone=${number}`;
    const command = `start "" "${whatsappURL}"`;
    exec(command, (error) => {
      if (error) {
        return res.json({ message: `❌ Could not open WhatsApp for ${number}` });
      }
      return res.json({
        message: `📞 WhatsApp chat opened for ${number}.`
      });
    });
    return;
  }

  // 🔸 Match: "call ravi +91..." or "message sneha +91..." — store contact
  const learnMatch = lower.match(/(?:call|message)\s+(\w+)\s+(\+91\d{10})/i);
  if (learnMatch) {
    const [, name, number] = learnMatch;
    const contacts = loadContacts();
    contacts[name.toLowerCase()] = number;
    saveContacts(contacts);

    const whatsappURL = `whatsapp://send?phone=${number}`;
    const command = `start "" "${whatsappURL}"`;
    exec(command, (error) => {
      if (error) {
        return res.json({ message: `❌ Could not open WhatsApp for ${name}` });
      }
      return res.json({
        message: `✅ Saved ${name} and opened WhatsApp for ${number}.`
      });
    });
    return;
  }

  // 🔸 Match: "call ravi" or "message sneha" — use stored contact
  const recallMatch = lower.match(/(?:call|message)\s+(\w+)/i);
  if (recallMatch) {
    const [, name] = recallMatch;
    const contacts = loadContacts();
    const number = contacts[name.toLowerCase()];
    if (number) {
      const whatsappURL = `whatsapp://send?phone=${number}`;
      const command = `start "" "${whatsappURL}"`;
      exec(command, (error) => {
        if (error) {
          return res.json({ message: `❌ Could not open WhatsApp for ${name}` });
        }
        return res.json({
          message: `📞 WhatsApp chat opened for ${name} at ${number}.`
        });
      });
    } else {
      return res.json({
        message: `🤖 I don't have a number saved for ${name}. You can teach me using: "call ${name} +91..."`
      });
    }
    return;
  }

  // 🔹 Fallback
  res.json({ message: "❌ Unknown command." });
});

// ✅ Start Server
app.listen(3000, () => console.log('✅ Server running on http://localhost:3000'));
