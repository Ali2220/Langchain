import dotenv from "dotenv";
dotenv.config();
import { ChatGoogle } from "@langchain/google";
import { PromptTemplate } from "@langchain/core/prompts";

const prompt = PromptTemplate.fromTemplate("Answer in Roman: {question}");

const model = new ChatGoogle({
  model: "gemini-3-flash-preview",
});

// // chain create ki.
// // prompt ka output --> model ka input ban rha hai.
const chain = prompt.pipe(model);

const response = await chain.invoke({ question: "What is the capital of USA" });

console.log(response.content);