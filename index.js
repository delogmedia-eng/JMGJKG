const express = require('express');
const cors = require('cors');
const axios = require('axios'); // تأكد إنك مسطب axios

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const API_KEY = process.env.API_KEY;

app.get('/', (req, res) => res.send('Ordy AI Direct Server is Online! 🚀'));

// نظام الشات والتلخيص باستخدام رابط مباشر (باي باس للمكتبة)
app.post('/api/chat', async (req, res) => {
    try {
        const userMessages = req.body.messages;
        const lastMsg = userMessages[userMessages.length - 1];

        // الرابط المباشر للإصدار المستقر v1
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        let contents = [{
            parts: [{ text: lastMsg.content }]
        }];

        // لو فيه صور، ضيفها للطلب المباشر
        if (lastMsg.images && lastMsg.images.length > 0) {
            lastMsg.images.forEach(img => {
                contents[0].parts.push({
                    inline_data: {
                        mime_type: "image/jpeg",
                        data: img.split(',')[1]
                    }
                });
            });
        }

        const response = await axios.post(url, { contents });

        if (response.data && response.data.candidates) {
            const reply = response.data.candidates[0].content.parts[0].text;
            res.json({ reply });
        } else {
            throw new Error("Invalid response from Google");
        }

    } catch (e) {
        console.error("DIRECT ERROR:", e.response ? e.response.data : e.message);
        res.status(500).json({ reply: "خطأ في الاتصال المباشر بجوجل: " + (e.response ? e.response.data.error.message : e.message) });
    }
});

app.post('/api/summary', async (req, res) => {
    try {
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        const contents = [{ parts: [{ text: "2 words title for: " + req.body.text }] }];
        const response = await axios.post(url, { contents });
        const title = response.data.candidates[0].content.parts[0].text.trim();
        res.json({ title });
    } catch (e) {
        res.json({ title: "New Chat" });
    }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Direct Server Live on ${PORT}`));
