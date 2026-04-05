const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const API_KEY = process.env.API_KEY;

const ORDY_IDENTITY = `You are "Ordy AI Roblox", an expert in Luau scripting. Never mention your model provider.`;

app.post('/api/chat', async (req, res) => {
    try {
        const userMessages = req.body.messages;
        const lastMsg = userMessages[userMessages.length - 1];
        const hasImages = lastMsg.images && lastMsg.images.length > 0;

        let requestBody = {};

        if (hasImages) {
            let contentParts = [{ type: "text", text: lastMsg.content || "Analyze this image for Roblox." }];
            lastMsg.images.forEach(img => {
                contentParts.push({ type: "image_url", image_url: { url: img } });
            });

            requestBody = {
                model: "llama-3.2-11b-vision-preview",
                messages: [
                    { role: "user", content: contentParts } // شيلنا الـ System من هنا عشان موديل الصور أحياناً بيرفضه
                ],
                max_tokens: 1024
            };
        } else {
            const fullHistory = [
                { role: "system", content: ORDY_IDENTITY },
                ...userMessages.map(m => ({
                    role: m.role === 'user' ? 'user' : 'assistant',
                    content: m.content || "[صورة سابقة]" // حماية عشان Groq ميرفضش الرسايل الفاضية
                }))
            ];

            requestBody = {
                model: "llama-3.3-70b-versatile",
                messages: fullHistory,
                temperature: 0.6
            };
        }

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', requestBody, {
            headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' }
        });

        res.json({ reply: response.data.choices[0].message.content });

    } catch (e) {
        // هنا هنخلي السيرفر يفضح Groq ويقولنا الخازوق فين بالظبط
        const errorDetails = e.response ? JSON.stringify(e.response.data) : e.message;
        console.error("CHAT ERROR:", errorDetails);
        res.status(500).json({ reply: "❌ التفاصيل التقنية للخطأ:\n\n```json\n" + errorDetails + "\n```" });
    }
});

app.post('/api/summary', async (req, res) => {
    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: "Summarize in 2 words: " + req.body.text }]
        }, { headers: { 'Authorization': `Bearer ${API_KEY}` } });
        res.json({ title: response.data.choices[0].message.content.trim().replace(/["*.]/g, '') });
    } catch (e) { res.json({ title: "New Chat" }); }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Debug Server is Live! 🚀`));
