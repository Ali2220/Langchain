import dotenv from "dotenv";
dotenv.config();

import { ChatGroq } from "@langchain/groq";
import readline from "readline";

const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.1-8b-instant", 
  temperature: 0.6,
});

let history = [];

async function streamChat(userInput) {
  history.push({ role: "user", content: userInput });

  let fullResponse = "";

  const stream = await model.stream(history);

  process.stdout.write("Assistant: ");

  for await (const chunk of stream) {
    if (chunk.content) {
      process.stdout.write(chunk.content);
      fullResponse += chunk.content;
    }
  }

  console.log("\n");

  history.push({ role: "assistant", content: fullResponse });
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function startChat() {
  console.log("💬 Simple Chatbot (type 'exit' to quit)\n");

  const ask = () => {
    rl.question("You: ", async (input) => {
      if (input.toLowerCase() === "exit") {
        console.log("👋 Goodbye!");
        rl.close();
        return;
      }

      await streamChat(input);
      ask();
    });
  };

  ask();
}

startChat();
