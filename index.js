const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const API_KEY = process.env.API_KEY;

const ORDY_IDENTITY = `You are "Ordy AI Roblox", an expert in Luau scripting and Roblox game mechanics. Never mention your model provider. You are Ordy-Brain v2. Your responses should be helpful and accurate.`;

app.post('/api/chat', async (req, res) => {
    try {
        const userMessages = req.body.messages;
        const lastMsg = userMessages[userMessages.length - 1];
        
        // هل المستخدم باعت صور؟
        const hasImages = lastMsg.images && lastMsg.images.length > 0;

        let requestBody = {};

        if (hasImages) {
            // حالة 1: المستخدم باعت صورة (نشغل موديل الـ Vision)
            let contentParts = [{ type: "text", text: lastMsg.content || "Please analyze this image for Roblox dev." }];
            
            lastMsg.images.forEach(img => {
                contentParts.push({
                    type: "image_url",
                    image_url: { url: img }
                });
            });

            requestBody = {
                model: "llama-3.2-11b-vision-preview",
                messages: [
                    { role: "system", content: ORDY_IDENTITY },
                    { role: "user", content: contentParts }
                ],
                max_tokens: 1024
            };
        } else {
            // حالة 2: المستخدم باعت نص بس (نشغل الموديل الجبار بالذاكرة)
            const fullHistory = [
                { role: "system", content: ORDY_IDENTITY },
                ...userMessages.map(m => ({
                    role: m.role === 'user' ? 'user' : 'assistant',
                    content: m.content
                }))
            ];

            requestBody = {
                model: "llama-3.3-70b-versatile",
                messages: fullHistory,
                temperature: 0.6
            };
        }

        // إرسال الطلب لـ Groq
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', requestBody, {
            headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' }
        });

        res.json({ reply: response.data.choices[0].message.content });

    } catch (e) {
        console.error("CHAT ERROR:", e.response ? JSON.stringify(e.response.data) : e.message);
        res.status(500).json({ reply: "❌ عذراً، أوردي يواجه مشكلة في معالجة طلبك حالياً." });
    }
});

// نظام التلخيص (اللي شغال زي الفل)
app.post('/api/summary', async (req, res) => {
    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: "Summarize in strictly 2 short words: " + req.body.text }]
        }, { headers: { 'Authorization': `Bearer ${API_KEY}` } });
        res.json({ title: response.data.choices[0].message.content.trim().replace(/["*.]/g, '') });
    } catch (e) { res.json({ title: "New Chat" }); }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Smart Ordy Server is Live! 🚀`));
