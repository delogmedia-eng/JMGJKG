const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); 

// اتأكد إنك حاطط المفتاح الجديد اللي قولتلك عليه من AI Studio في Railway
const genAI = new GoogleGenerativeAI(process.env.API_KEY || "");

app.get('/', (req, res) => res.send('Ordy AI is ready! 🚀'));

app.post('/api/chat', async (req, res) => {
    try {
        // جربنا هنا الموديل بكلمة latest عشان نتخطى الـ 404
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const userMessages = req.body.messages;
        const lastMsg = userMessages[userMessages.length - 1];

        let parts = [lastMsg.content];
        if (lastMsg.images && lastMsg.images.length > 0) {
            lastMsg.images.forEach(img => {
                parts.push({ inlineData: { data: img.split(',')[1], mimeType: "image/jpeg" } });
            });
        }

        const result = await model.generateContent(parts);
        res.json({ reply: result.response.text() });
    } catch (e) {
        console.error("Error Details:", e);
        res.status(500).json({ reply: "خطأ في السيرفر: " + e.message });
    }
});

// سطر التلخيص
app.post('/api/summary', async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const result = await model.generateContent("Give me a 2 word title for: " + req.body.text);
        res.json({ title: result.response.text().trim() });
    } catch (e) {
        res.json({ title: "New Chat" });
    }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server live on ${PORT}`));