import dotenv from "dotenv";
dotenv.config();
import { ChatGoogle } from "@langchain/google";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";

const model = new ChatGoogle({
  model: "gemini-3-flash-preview",
  temperature: 0.5,
});

const parser = new StringOutputParser();

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant. Answer in Roman Urdu"],
  new MessagesPlaceholder("history"),
  ["human", "{input}"],
]);

const chain = prompt.pipe(model).pipe(parser);

const messageHistories = {};

async function chatWithMemory(sessionId, userInput) {
  if (!messageHistories[sessionId]) {
    messageHistories[sessionId] = new InMemoryChatMessageHistory();
  }

  const memory = messageHistories[sessionId];

  const previousMessages = await memory.getMessages();

  const response = await chain.invoke({
    input: userInput,
    history: previousMessages,
  });

  await memory.addUserMessage(userInput);
  await memory.addAIMessage(response);

  return response;
}

async function test() {
  const sessionId = "abc-123";

  const msg1 = await chatWithMemory(sessionId, "Hi mera name Ali hai");
  console.log(msg1);

  const msg2 = await chatWithMemory(
    sessionId,
    "Pakistan mai north k kuch sb se khusburat areas ke names btao",
  );
  console.log(msg2);

  const msg3 = await chatWithMemory(sessionId, "Mera Naam kia hai ?");
  console.log(msg3);
}

test()