// Start
//   ↓
// Load .env + import ChatGroq
//   ↓
// Create model instance
//   ↓
// Define getCurrentTime() function
//   ↓
// Bind tool to model → modelWithTools
//   ↓
// Call agentWithTimeTool("What time...")
//   ↓
// modelWithTools.invoke() → AI sochta hai
//   ↓
// AI decides: tool call karna hai
//   ↓
// Response mein tool_calls array aata hai
//   ↓
// Loop detect karta hai "get_current_time"
//   ↓
// Call actual getCurrentTime() → "5:30:45 PM"
//   ↓
// Return "Current time: 5:30:45 PM"
//   ↓
// Console print
//   ↓
// End

import dotenv from "dotenv";
dotenv.config();
import { ChatGroq } from "@langchain/groq";

const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.1-8b-instant",
  temperature: 0.2,
});

function getCurrentTime() {
  return new Date().toLocaleTimeString();
}

const modelWithTools = model.bindTools([
  {
    name: "get_current_time",
    description: "Get the current time",
    schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
]);

async function agentWithTimeTool(userInput) {
  const response = await modelWithTools.invoke(userInput);

  // Check if AI wants to use a tool
  const toolCalls = response.additional_kwargs?.tool_calls;

  if (toolCalls && toolCalls.length > 0) {
    for (const toolCall of toolCalls) {
      if (toolCall.function.name === "get_current_time") {
        const result = getCurrentTime();
        return `Current Time: ${result}`;
      }
    }
  }

  return response.content;
}

console.log(await agentWithTimeTool("What time is it ?"));
