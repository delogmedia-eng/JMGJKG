const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' })); 

const apiKey = process.env.API_KEY;

// السطر السحري: أجبرناه يستخدم v1 المستقرة بدل v1beta
const genAI = new GoogleGenerativeAI(apiKey || "");

app.get('/', (req, res) => {
    res.send('Ordy AI Server is Live and Stable! 🚀');
});

app.post('/api/summary', async (req, res) => {
    try {
        if (!apiKey) return res.json({ title: "New Chat" });
        // حددنا الإصدار v1 هنا يدوياً كحماية إضافية
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1' });
        const prompt = `Give me a very short title (2-3 words) for this text: ${req.body.text}`;
        const result = await model.generateContent(prompt);
        res.json({ title: result.response.text().trim().replace(/["*]/g, '') });
    } catch (error) {
        console.error("Summary Error:", error);
        res.json({ title: "New Chat" });
    }
});

app.post('/api/chat', async (req, res) => {
    try {
        if (!apiKey) {
            return res.status(500).json({ reply: '❌ API_KEY is missing in Railway Variables.' });
        }
        
        // حددنا الإصدار v1 هنا برضه
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1' });
        const userMessages = req.body.messages;
        const lastMessage = userMessages[userMessages.length - 1];

        let promptParts = [lastMessage.content];

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
        res.status(500).json({ reply: '❌ Error connecting to AI. Please check your API Key and Logs.' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running beautifully on port ${PORT}`);
});