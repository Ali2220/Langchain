import dotenv from "dotenv";
dotenv.config();
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

let conversationHistory = [];

async function chat(userInput) {
  conversationHistory.push({ role: "user", content: userInput });

  let historyText;

  for (const msg of conversationHistory) {
    historyText += `${msg.role === "user" ? "User" : "Assistant"} : ${msg.content}\n`;
  }

  let prompt = `
    Conversation so far:
    ${historyText}
    
    Assistant:
    `;

  let response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: "You are a helpful assistant. Answer in Roman Urdu.",
    },
  });

  conversationHistory.push({ role: "assistant", content: response.text });

  console.log(response.text);
}

await chat("Assalam-o-Alaikum! Mera naam Salahuddin hai.")
await chat("Mera naam kya hai?")