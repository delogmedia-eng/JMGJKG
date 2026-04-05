const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
// السطر ده مهم جداً لريلاوي عشان يلقط البورت
const PORT = process.env.PORT || 3000;

// حل مشكلة CORS من الجذور
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' })); // عشان يستحمل الصور

// التحقق من مفتاح جوجل من ريلاوي
const apiKey = process.env.API_KEY;
if (!apiKey) {
    console.error("⚠️ تحذير: مفتاح API_KEY غير موجود في إعدادات Railway!");
}

// تهيئة الذكاء الاصطناعي (حطينا حماية عشان ميقعش لو المفتاح ناقص)
const genAI = new GoogleGenerativeAI(apiKey || 'dummy-key');

// نقطة فحص لريلاوي عشان يعرف إن السيرفر عايش
app.get('/', (req, res) => {
    res.send('Ordy AI Server is Online! 🚀');
});

// 1. التلخيص (العنوان)
app.post('/api/summary', async (req, res) => {
    try {
        if (!apiKey) return res.json({ title: "New Chat" });
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `أعطني عنواناً قصيراً جداً (كلمتين أو ثلاثة) يعبر عن هذا النص: ${req.body.text}`;
        const result = await model.generateContent(prompt);
        res.json({ title: result.response.text().trim().replace(/["*]/g, '') });
    } catch (error) {
        res.json({ title: "New Chat" });
    }
});

// 2. الشات والصور
app.post('/api/chat', async (req, res) => {
    try {
        if (!apiKey) {
            return res.status(500).json({ reply: '❌ السيرفر لا يمتلك مفتاح API. أضفه في Railway Variables.' });
        }
        
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const userMessages = req.body.messages;
        const lastMessage = userMessages[userMessages.length - 1];

        let promptParts = [lastMessage.content];

        // معالجة الصور لو موجودة
        if (lastMessage.images && lastMessage.images.length > 0) {
            lastMessage.images.forEach(imgBase64 => {
                const mimeType = imgBase64.match(/data:(.*?);base64,/)[1];
                const base64Data = imgBase64.replace(/^data:image\/\w+;base64,/, "");
                promptParts.push({
                    inlineData: { data: base64Data, mimeType: mimeType }
                });
            });
        }

        const result = await model.generateContent(promptParts);
        res.json({ reply: result.response.text() });

    } catch (error) {
        console.error(error);
        res.status(500).json({ reply: '❌ حدث خطأ أثناء معالجة رسالتك في السيرفر.' });
    }
});

// السطر السحري: إجبار السيرفر يسمع من 0.0.0.0 عشان ريلاوي ميزعلش
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running beautifully on port ${PORT}`);
});