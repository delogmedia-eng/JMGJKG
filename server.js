const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = 3000;

app.use(cors());

// السيرفر بيشيل لحد 50 ميجا عشان يستوعب عدد الصور الكبير
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((err, req, res, next) => {
    if (err) {
        console.log('[-] إيرور في استلام البيانات:', err.message);
        return res.status(200).json({ reply: '❌ مساحة الصور مجتمعة ضخمة جداً! قلل عدد الصور أو مساحتها.' });
    }
    next();
});

app.use(express.static(__dirname));

const genAI = new GoogleGenerativeAI("AIzaSyDICA1qokVRAESne31nfdQ48qprR7PRbjc");

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages || messages.length === 0) throw new Error("مفيش بيانات وصلت");
        
        console.log(`\n[+] طلب جديد لـ Ordy AI (يدعم الصور المتعددة)... ⏳`);

        const aiModel = genAI.getGenerativeModel({
            model: "gemini-flash-lite-latest", 
            systemInstruction: `أنت Ordy AI، مبرمج Senior وخبير برمجة Roblox Luau. 
            قواعد صارمة للرد:
            1. ركز 100% على روبلوكس و Luau.
            2. استخدم أحدث أساليب البرمجة.
            3. اشرح الكود سطر بسطر.
            4. إذا أرسل المستخدم عدة صور، اربط بينها وحللها برمجياً لمساعدته.`
        });

        // الذاكرة (History) بتستقبل النصوص بس عشان جوجل مترفضش الطلب
        const formattedHistory = messages.slice(0, -1).map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content || "[صور مرفقة]" }]
        }));

        const chat = aiModel.startChat({ history: formattedHistory });
        
        // ====== معالجة الرسالة الحالية (نص + مصفوفة صور لحد 100) ======
        const lastMsg = messages[messages.length - 1];
        let currentParts = [{ text: lastMsg.content || "اشرح هذه الصور" }];
        
        if (lastMsg.images && Array.isArray(lastMsg.images)) {
            // بناخد أول 100 صورة بس كحد أقصى
            const imagesToProcess = lastMsg.images.slice(0, 100);
            
            imagesToProcess.forEach(img => {
                const match = img.match(/^data:(image\/\w+);base64,(.+)$/);
                if (match) {
                    currentParts.push({
                        inlineData: { mimeType: match[1], data: match[2] }
                    });
                }
            });
            console.log(`[+] تم استلام ${imagesToProcess.length} صورة بنجاح 📸`);
        }
        
        const result = await chat.sendMessage(currentParts);
        res.status(200).json({ reply: result.response.text() });

    } catch (error) {
        console.error(`[-] إيرور:`, error.message);
        res.status(200).json({ reply: `❌ مشكلة: ${error.message}` });
    }
});

app.post('/api/summary', async (req, res) => {
    const text = req.body.text || "محادثة جديدة";
    try {
        const aiModel = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });
        const result = await aiModel.generateContent(`لخص هذا في 3 كلمات: "${text}"`);
        res.status(200).json({ title: result.response.text().trim().replace(/['"]/g, '') });
    } catch (error) {
        res.status(200).json({ title: String(text).substring(0, 20) + "..." });
    }
});

app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`[+] سيرفر Ordy AI جاهز لاستقبال 100 صورة 🚀`);
    console.log(`[+] البورت: 3000`);
    console.log(`=========================================`);
});