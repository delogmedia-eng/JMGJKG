const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const API_KEY = process.env.API_KEY; // مفتاح Groq (gsk_...)

// دستور أوردي السري - البرومبت ده بيحدد ذكاء وشخصية السيستم
const ORDY_IDENTITY = `
You are "Ordy AI Roblox", the world's most advanced AI specialized in Luau scripting and Roblox game mechanics.
- YOUR IDENTITY: You are a proprietary AI developed by the OrdyCopy team. 
- STRICT RULE: Never mention "Meta", "Llama", or any other AI models. If asked about your model, reply that you are "Ordy-Brain v2", a custom-built architecture for Roblox developers.
- BEHAVIOR: You have a broad and deep understanding of game design. Don't just give a script; analyze the user's intent, double-check for potential bugs, and suggest optimizations. 
- MEMORY: You are part of a continuous conversation. Use previous messages to provide context-aware answers.
- STYLE: Professional, witty, and extremely knowledgeable about the Roblox engine. Speak the user's language (Arabic or English) naturally.
`;

app.get('/', (req, res) => res.send('Ordy AI Brain is Active! 🧠✨'));

app.post('/api/chat', async (req, res) => {
    try {
        const userMessages = req.body.messages; // دي المصفوفة اللي فيها كل تاريخ الشات
        
        // بناء سياق المحادثة بالكامل عشان الذكاء الاصطناعي يفتكر الكلام القديم
        const fullConversation = [
            { role: "system", content: ORDY_IDENTITY },
            ...userMessages.map(m => ({ 
                role: m.role === 'user' ? 'user' : 'assistant', 
                content: m.content 
            }))
        ];

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile", 
            messages: fullConversation,
            temperature: 0.6, // عشان يكون دقيق في الكود وميهيسش
            max_tokens: 4096
        }, {
            headers: { 
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json' 
            }
        });

        const reply = response.data.choices[0].message.content;
        res.json({ reply });

    } catch (e) {
        console.error("LOG ERROR:", e.message);
        res.status(500).json({ reply: "❌ خطأ في معالج أوردي: " + (e.response ? e.response.data.error.message : e.message) });
    }
});

app.post('/api/summary', async (req, res) => {
    try {
        const text = req.body.text;
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.1-8b-instant",
            messages: [
                { role: "system", content: "Summarize the user's request into exactly 2 words in the same language as the input." },
                { role: "user", content: text }
            ]
        }, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        
        let title = response.data.choices[0].message.content.trim().replace(/["*.]/g, '');
        res.json({ title });
    } catch (e) {
        res.json({ title: "Roblox Chat" });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ordy AI (The Ultimate Brain) is running on port ${PORT} 🚀`);
});
