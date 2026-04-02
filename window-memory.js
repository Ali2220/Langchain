import dotenv from "dotenv";
dotenv.config();
import { ChatGoogle } from "@langchain/google";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const model = new ChatGoogle({
  model: "gemini-3-flash-preview",
  temperature: "0.7",
});

const parser = new StringOutputParser();

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant. Answer briefly."],
  new MessagesPlaceholder("history"),
  ["human", "{input}"],
]);

const chain = prompt.pipe(model).pipe(parser);

function createWindowMemory(windowSize = 4) {
  return {
    messages: [],
    windowSize: windowSize,

    addUserMessage(content) {
      this.messages.push({ role: "user", content });
      this.trimMessages();
    },

    addAIMessage(content) {
      this.messages.push({ role: "assistant", content });
      this.trimMessages();
    },

    trimMessages() {
      if (this.messages.length > this.windowSize) {
        this.messages = this.messages.slice(-this.windowSize);
      }
    },

    getMessages() {
      return this.messages.map((msg) => ({
        type: msg.role === "user" ? "human" : "ai",
        content: msg.content,
      }));
    },
  };
}

const sessionMemory = {};

async function chat(sessionId, userInput) {
  if (!sessionMemory[sessionId]) {
    sessionMemory[sessionId] = createWindowMemory(4);
  }

  const memory = sessionMemory[sessionId];
  const history = memory.getMessages();

  const response = await chain.invoke({
    history: history,
    input: userInput,
  });

  memory.addUserMessage(userInput);
  memory.addAIMessage(response);

  return response;
}

async function test() {
  const sessionId = "abc-123";

  for (let i = 0; i < 10; i++) {
    const response = await chat(sessionId, `This is message number ${i}`);
    console.log(`Message ${i}:`, response);
  }

  console.log("\nMemory stores only:", sessionMemory[sessionId].messages.length, "messages");
}

test()