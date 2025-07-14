import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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

// ✅ Application status API
app.get('/api/status/:studentId', async (req, res) => {
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

// ✅ Chatbot API
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
        messages: messages,
        model: model,
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

app.listen(3000, () => console.log('✅ Server running on http://localhost:3000'));
