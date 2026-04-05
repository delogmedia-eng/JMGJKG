const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' })); 

const apiKey = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

app.get('/', (req, res) => {
    res.send('Ordy AI Server is Live! 🚀');
});

app.post('/api/summary', async (req, res) => {
    try {
        if (!apiKey) return res.json({ title: "New Chat" });
        // غيرنا الموديل هنا لـ gemini-pro
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `Give me a very short title (2-3 words) for this text: ${req.body.text}`;
        const result = await model.generateContent(prompt);
        res.json({ title: result.response.text().trim().replace(/["*]/g, '') });
    } catch (error) {
        console.error("Summary Error:", error);
        res.json({ title: "New Chat" });
    }
});

app.post('/api/chat', async (req, res) => {
    try {
        if (!apiKey) {
            return res.status(500).json({ reply: '❌ API_KEY is missing.' });
        }
        
        // غيرنا الموديل هنا لـ gemini-pro
        // ملحوظة: لو هترفع صور، gemini-pro العادي مش بيدعمها، لازم gemini-pro-vision
        // بس خلينا نشغل النص الأول ونضمن إن السيرفر نطق!
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const userMessages = req.body.messages;
        const lastMessage = userMessages[userMessages.length - 1];

        const result = await model.generateContent(lastMessage.content);
        res.json({ reply: result.response.text() });

    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ reply: '❌ Error connecting to AI. Please check your API Key.' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running beautifully on port ${PORT}`);
});