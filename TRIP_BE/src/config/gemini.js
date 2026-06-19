import { GoogleGenAI } from '@google/genai';

// Cara pakai di ai.service.js:
//
// Single-turn / stateless dengan full history:
//   const response = await genAI.models.generateContent({
//     model: 'gemini-2.0-flash',
//     contents: [...conversationHistory, { role: 'user', parts: [{ text: message }] }],
//     config: {
//       systemInstruction: '...',
//       responseMimeType: 'application/json',
//     },
//   });
//   const result = JSON.parse(response.text);
//
// Multi-turn dengan helper chat (SDK kelola history otomatis):
//   const chat = genAI.chats.create({ model: 'gemini-2.0-flash', history: [...] });
//   const response = await chat.sendMessage({ message: '...' });
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default genAI;
