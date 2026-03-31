import dotenv from "dotenv";
dotenv.config();
import { ChatGoogle } from "@langchain/google";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const model = new ChatGoogle({
  model: "gemini-3-flash-preview",
});

const parser = new StringOutputParser();

// Step 1: Translation chain
const translatePrompt = PromptTemplate.fromTemplate(`
    "Translate the following text to Roman Urdu:\n\n{text}"
    `);
const translateChain = translatePrompt.pipe(model).pipe(parser);

// Step 2: Summary chain
const summarizePrompt = PromptTemplate.fromTemplate(`
    "Summarize the following text to Roman Urdu:\n\n{text}"
    `);
const summarizeChain = summarizePrompt.pipe(model).pipe(parser);

// Sequential chain banayein
async function translateAndSummarize() {
  // Step 1: Translate
  const translatedResponse = await translateChain.invoke({ text });
  console.log("\nTranslated: ", translatedResponse);

  // Step 2: Summarize
  const summarizeResponse = await summarizeChain.invoke({ text });
  console.log("\nSummarized: ", summarizeResponse);
}

const text =
  "Pakistan is a beautiful country with rich culture, diverse landscapes, and warm hospitality. From the mountains of the north to the beaches of the south, it offers incredible experiences for travelers.";

translateAndSummarize(text);
