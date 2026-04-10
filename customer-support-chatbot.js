import dotenv from "dotenv";
dotenv.config();
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

let sessions = {};

async function customerSupportChat(userId, userInput) {
  if (!sessions[userId]) {
    sessions[userId] = {
      history: [],
      orderNumber: null,
      issue: null,
    };
  }

  const session = sessions[userId];
  session.history.push({ role: "user", content: userInput });

  // Extract order number if present
  const orderMatch = userInput.match(/ORD-\d+/i);
  if (orderMatch) {
    session.orderNumber = orderMatch[0];
  }

  if (userInput.includes("return") || userInput.includes("refund")) {
    session.issue = "return";
  } else if (userInput.includes("delay") || userInput.includes("shipping")) {
    session.issue = "shipping";
  }

  let historyText = "";
  for (const msg of session.history.slice(-10)) {
    historyText += `${msg.role === "user" ? "Customer" : "Agent"} : ${msg.content}\n`;
  }

  let prompt = `You are a customer support agent for an online store. Be helpful and polite.
  
${session.orderNumber ? `Customer order number: ${session.orderNumber}` : ""}
${session.issue ? `Identified issue: ${session.issue}` : ""}

Conversation:
${historyText}

Agent:
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  const agentReply = response.text;
  session.history.push({ role: "assistant", content: agentReply });

  return { reply: agentReply, orderNumber: session.orderNumber };
}

// test
async function testSupport() {
  console.log("🛒 Customer Support Chatbot\n");
  
  // User 1
  let res = await customerSupportChat("user1", "Mera order abhi tak nahi aaya. Order number ORD-12345 hai.");
  console.log("User1:", "Mera order abhi tak nahi aaya. Order number ORD-12345 hai.");
  console.log("Bot:", res.reply);
  console.log("Order:", res.orderNumber);
  console.log();
  
  res = await customerSupportChat("user1", "Kab tak milega?");
  console.log("User1:", "Kab tak milega?");
  console.log("Bot:", res.reply);
  console.log();
  
  // User 2 (different session)
  res = await customerSupportChat("user2", "Main product return karna chahta hun.");
  console.log("User2:", "Main product return karna chahta hun.");
  console.log("Bot:", res.reply);
}

testSupport();