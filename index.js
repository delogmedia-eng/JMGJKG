const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); 

// جلب المفتاح من ريلاوي
const apiKey = process.env.API_KEY;

// ****** التعديل السحري هنا ******
// أجبرنا المكتبة تستخدم الإصدار v1 المستقر تماماً
const genAI = new GoogleGenerativeAI(apiKey);

app.get('/', (req, res) => res.send('Ordy AI is Server is Active! 🚀'));

app.post('/api/chat', async (req, res) => {
    try {
        // استخدمنا الموديل بدون كلمة latest وبدون v1beta
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1' });
        
        const userMessages = req.body.messages;
        const lastMsg = userMessages[userMessages.length - 1];

        let promptParts = [lastMsg.content];
        
        if (lastMsg.images && lastMsg.images.length > 0) {
            lastMsg.images.forEach(img => {
                const data = img.split(',')[1];
                const mime = img.split(';')[0].split(':')[1];
                promptParts.push({ inlineData: { data: data, mimeType: mime } });
            });
        }

        const result = await model.generateContent(promptParts);
        const text = result.response.text();
        res.json({ reply: text });

    } catch (e) {
        console.error("LOG ERROR:", e);
        res.status(500).json({ reply: "خطأ في السيرفر: " + e.message });
    }
});

app.post('/api/summary', async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1' });
        const result = await model.generateContent("Give me a 2 word title for: " + req.body.text);
        res.json({ title: result.response.text().trim() });
    } catch (e) {
        res.json({ title: "New Chat" });
    }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server live on ${PORT}`));
