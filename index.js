const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
// Railway بيحتاج السطر ده عشان يقرأ البورت أوتوماتيك
const PORT = process.env.PORT || 3000;

// إعدادات CORS عشان الموقع يكلم السيرفر بدون مشاكل
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' })); 

// جلب مفتاح API من إعدادات ريلاوي
const apiKey = process.env.API_KEY;

// تهيئة الذكاء الاصطناعي
const genAI = new GoogleGenerativeAI(apiKey || "");

// نقطة فحص للتأكد أن السيرفر يعمل
app.get('/', (req, res) => {
    res.send('Ordy AI Server is Live! 🚀');
});

// 1. نظام التلخيص (توليد عنوان المحادثة)
app.post('/api/summary', async (req, res) => {
    try {
        if (!apiKey) return res.json({ title: "New Chat" });
        // استخدمنا المسار الكامل للموديل عشان نتجنب خطأ الـ 404
        const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });
        const prompt = `Give me a very short title (2-3 words) for this text: ${req.body.text}`;
        const result = await model.generateContent(prompt);
        res.json({ title: result.response.text().trim().replace(/["*]/g, '') });
    } catch (error) {
        console.error("Summary Error:", error);
        res.json({ title: "New Chat" });
    }
});

// 2. نظام الشات والتعرف على الصور
app.post('/api/chat', async (req, res) => {
    try {
        if (!apiKey) {
            return res.status(500).json({ reply: '❌ API_KEY is missing in Railway Variables.' });
        }
        
        const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });
        const userMessages = req.body.messages;
        const lastMessage = userMessages[userMessages.length - 1];

        let promptParts = [lastMessage.content];

        // معالجة الصور المتعددة وتحويلها لصيغة يفهمها جوجل
        if (lastMessage.images && lastMessage.images.length > 0) {
            lastMessage.images.forEach(imgBase64 => {
                try {
                    const mimeType = imgBase64.match(/data:(.*?);base64,/)[1];
                    const base64Data = imgBase64.replace(/^data:image\/\w+;base64,/, "");
                    promptParts.push({
                        inlineData: { data: base64Data, mimeType: mimeType }
                    });
                } catch (e) {
                    console.error("Image processing error:", e);
                }
            });
        }

        const result = await model.generateContent(promptParts);
        res.json({ reply: result.response.text() });

    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ reply: '❌ Error connecting to AI. Please check logs.' });
    }
});

// تشغيل السيرفر على 0.0.0.0 مهم جداً للاستضافات السحابية
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running beautifully on port ${PORT}`);
});