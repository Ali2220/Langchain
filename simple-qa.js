import dotenv from "dotenv";
dotenv.config();
import { ChatGoogle } from "@langchain/google";
import { PromptTemplate } from "@langchain/core/prompts";

const prompt = PromptTemplate.fromTemplate(
  `
    You are a useful assistant. Give me the answer concisely.
    Question: {question}
    Answer:

    `,
);

const model = new ChatGoogle({
  model: "gemini-3-flash-preview",
});

const chain = prompt.pipe(model);

const questions = [
  "What is the capital of Pakistan?",
  "Who wrote 'Allama Iqbal poetry?",
  "What is the national game of Pakistan?",
];

for (let q of questions) {
  let response = await chain.invoke({ question: q });
  console.log(`\nQ: ${q}`);
  console.log(`A: ${response.content}`);
}
