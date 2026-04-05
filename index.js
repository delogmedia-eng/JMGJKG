const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const API_KEY = process.env.API_KEY; // مفتاح Groq اللي بيبدأ بـ gsk_

app.get('/', (req, res) => res.send('Ordy AI Groq Server is Flying! 🚀'));

app.post('/api/chat', async (req, res) => {
    try {
        const lastMsg = req.body.messages[req.body.messages.length - 1];
        
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile", // موديل قوي جداً وسريع
            messages: [{ role: "user", content: lastMsg.content }]
        }, {
            headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' }
        });

        res.json({ reply: response.data.choices[0].message.content });
    } catch (e) {
        console.error("GROQ ERROR:", e.message);
        res.status(500).json({ reply: "خطأ في السيرفر الجديد: " + e.message });
    }
});

app.post('/api/summary', async (req, res) => {
    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: "اعطني عنوان من كلمتين فقط لهذا النص: " + req.body.text }]
        }, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        res.json({ title: response.data.choices[0].message.content.replace(/["*]/g, '') });
    } catch (e) { res.json({ title: "New Chat" }); }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Groq Server Live on ${PORT}`));
