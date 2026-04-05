const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); 

const apiKey = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

app.get('/', (req, res) => res.send('Ordy AI Server is Live! 🚀'));

app.post('/api/chat', async (req, res) => {
    try {
        if (!apiKey || apiKey.length < 10) {
            return res.status(500).json({ reply: "⚠️ المفتاح غير موجود أو قصير جداً في ريلاوي!" });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const userMessages = req.body.messages;
        const lastMsg = userMessages[userMessages.length - 1];

        let promptParts = [lastMsg.content];
        if (lastMsg.images && lastMsg.images.length > 0) {
            lastMsg.images.forEach(img => {
                promptParts.push({ inlineData: { data: img.split(',')[1], mimeType: "image/jpeg" } });
            });
        }

        const result = await model.generateContent(promptParts);
        res.json({ reply: result.response.text() });

    } catch (e) {
        console.error("CRITICAL ERROR:", e.message);
        res.status(500).json({ reply: "خطأ في السيرفر: " + e.message });
    }
});

app.post('/api/summary', async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("2 words title: " + req.body.text);
        res.json({ title: result.response.text().trim() });
    } catch (e) { res.json({ title: "New Chat" }); }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server started on port ${PORT}`));
