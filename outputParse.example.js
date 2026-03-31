// Restaurant Review Analyzer
import dotenv from "dotenv";
dotenv.config();
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatGoogle } from "@langchain/google";

// 1. Create LLM (Gemini)
const model = new ChatGoogle({
  model: "gemini-3-flash-preview",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.2,
});

// 2. Define what fields to extract
const parser = StructuredOutputParser.fromNamesAndDescriptions({
  sentiment: "Overall sentiment (positive/negative/neutral)",
  rating: "Rating 1-5",
  food_quality: "Food comments",
  service_quality: "Service comments",
  price_value: "Price value comments",
  improvements: "List of suggested improvements",
});

// 3. Create prompt that tells LLM the exact JSON format
const formatInstructions = parser.getFormatInstructions();

const prompt = new PromptTemplate({
  template: `
Respond ONLY with valid JSON matching the format above.

Review to Analyze: {review}

{format_instructions}
  `,
  inputVariables: ["review"],
  partialVariables: { format_instructions: formatInstructions },
});

// 4. Chain: prompt → model → parser (handles everything)
const chain = prompt.pipe(model).pipe(parser);

const review = await chain.invoke({
  review:
    "Biryani was amazing! Service slow (20min wait). Good value at 500rs. Less crowded waiting area needed.",
});

console.log(review);
