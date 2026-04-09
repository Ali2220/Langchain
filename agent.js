// Overall Flow:
// 1. Setup → API key load, Gemini client banaya

// 2. Tools registry → har tool ka description aur execution function

// 3. Agent function → user query leta hai

// 4. Tool list string banayi jaati hai (object.entries + map + join)

// 5. Prompt banaya jaata hai jo AI ko batata hai ki kaunsa tool kab use karna hai

// 6. AI se response aata hai – wo decide karta hai tool name aur arguments

// 7. Parsing karte hain – check "TOOL:" ya "NO_TOOL:"

// 8. Tool execute karte hain (agar calculator hai to expression nikaal kar, warna bina argument)

// 9. Result return hota hai aur console mein print hota hai

import dotenv from "dotenv";
dotenv.config();
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

let tools = {
  calculator: {
    description:
      "Use this for mathematical calculations like addition, subtraction, multiplication, division",
    execute: async (expression) => {
      try {
        let result = eval(expression);
        return `Result: ${result}`;
      } catch {
        return "Invalid Expression";
      }
    },
  },
  getTime: {
    description: "Get the current time",
    execute: async () => {
      return `Current Time: ${new Date().toLocaleTimeString()}`;
    },
  },
  getDate: {
    description: "Get the today's Date",
    execute: async () => {
      return `Today's Date: ${new Date().toDateString()}`;
    },
  },
};

async function agent(query) {
  console.log(`User Query: ${query}`);

  const toolDescription = Object.entries(tools)
    .map(([name, tool]) => `${name}: ${tool.description}`)
    .join("\n");

  const prompt = `You are an assistant that decides which tool to use.
  
Available tools:
${toolDescription}

User query: "${query}"

If the user wants to calculate something, respond with: TOOL:calculator EXPRESSION:expression
If user wants time, respond with: TOOL:getTime
If user wants date, respond with: TOOL:getDate
If no tool needed, respond with: NO_TOOL: answer directly

Your response (only the format above):`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const decision = response.text.trim();
  console.log("Agent Decision: ", decision);

  if (decision.startsWith("TOOL:")) {
    const parts = decision.split(" ");
    const toolName = parts[0].replace("TOOL:", "");

    if (toolName === "calculator") {
      const expression = decision.match(/EXPRESSION:(.*)/)?.[1];

      if (expression && tools[toolName]) {
        return await tools[toolName].execute(expression);
      }
    } else if (tools[toolName]) {
      return await tools[toolName].execute();
    }
  } else if (decision.startsWith("NO_TOOL:")) {
    return decision.replace("NO_TOOL:", "").trim();
  }

  return "Sorry! I could not process that.";
}

console.log(await agent("What is 25 + 17?"));
console.log(await agent("What time is it right now?"));
console.log(await agent("Tell me today's date"));
console.log(await agent("Hello, how are you?"));
