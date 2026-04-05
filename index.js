const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); 

const apiKey = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

app.get('/', (req, res) => res.send('Ordy AI Legacy Server is Live! 🚀'));

app.post('/api/chat', async (req, res) => {
    try {
        // غيرنا الموديل لـ gemini-1.0-pro لأنه أكثر استقراراً في السيرفرات
        const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        
        const userMessages = req.body.messages;
        const lastMsg = userMessages[userMessages.length - 1];

        // تنبيه: موديل 1.0 pro لا يدعم الصور، فلو بعت صورة هيرد نص بس
        const result = await model.generateContent(lastMsg.content);
        const text = result.response.text();
        res.json({ reply: text });

    } catch (e) {
        console.error("LOG ERROR:", e);
        res.status(500).json({ reply: "خطأ في السيرفر: " + e.message });
    }
});

app.post('/api/summary', async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        const result = await model.generateContent("Give me a 2 word title for: " + req.body.text);
        res.json({ title: result.response.text().trim() });
    } catch (e) {
        res.json({ title: "New Chat" });
    }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server live on ${PORT}`));
