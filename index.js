const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // مهم عشان حجم الصور

const API_KEY = process.env.API_KEY;

const ORDY_IDENTITY = `You are "Ordy AI Roblox", an expert in Luau scripting. You can see and analyze images of Roblox Studio, scripts, or errors. Never mention your model provider. You are Ordy-Brain v2.`;

app.post('/api/chat', async (req, res) => {
    try {
        const userMessages = req.body.messages;
        const lastMsg = userMessages[userMessages.length - 1];

        // مصفوفة الرسايل لـ Groq
        let contentParts = [{ type: "text", text: lastMsg.content || "Analyze this image" }];

        // لو فيه صور، ضيفها بصيغة Groq Vision
        if (lastMsg.images && lastMsg.images.length > 0) {
            lastMsg.images.forEach(img => {
                contentParts.push({
                    type: "image_url",
                    image_url: { url: img } // بيبعت الـ Base64 مباشرة
                });
            });
        }

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.2-11b-vision-preview", // الموديل اللي بيشوف الصور
            messages: [
                { role: "system", content: ORDY_IDENTITY },
                { role: "user", content: contentParts }
            ],
            max_tokens: 1024
        }, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });

        res.json({ reply: response.data.choices[0].message.content });
    } catch (e) {
        console.error("VISION ERROR:", e.response ? e.response.data : e.message);
        res.status(500).json({ reply: "❌ السيرفر تعذر عليه رؤية الصورة." });
    }
});

// سطر التلخيص (Summary) خليه زي ما هو
app.post('/api/summary', async (req, res) => {
    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: "Summarize in 2 words: " + req.body.text }]
        }, { headers: { 'Authorization': `Bearer ${API_KEY}` } });
        res.json({ title: response.data.choices[0].message.content.trim() });
    } catch (e) { res.json({ title: "Roblox Chat" }); }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Vision Server Live!`));
