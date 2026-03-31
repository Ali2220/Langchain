// Output Parser = Model ka response raw text hota hai. Output parser ausse structured format mein convert karta hai (JSON, array, etc.).

// FLOW --> Prompt → Gemini → Raw text → Parser → Clean (STRING / ARRAY / JSON)

import dotenv from 'dotenv'
dotenv.config()
import {
  StringOutputParser,
  CommaSeparatedListOutputParser,
  StructuredOutputParser,
} from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatGoogle } from "@langchain/google";

// 1. String Output Parser
const parser = new StringOutputParser();
const result = await parser.parse("Hello World");
console.log(result);

// 2. Comma Separated List Parser
const parser2 = new CommaSeparatedListOutputParser();
const result2 = await parser2.parse("apple, banana, orange");
console.log(result2);

// 3. Structured Output Parser (JSON)

// define schema
const parser3 = StructuredOutputParser.fromNamesAndDescriptions({
  name: "Person's name",
  age: "Person's age in years",
  city: "City where persons lives",
});

const formatInstructions = parser3.getFormatInstructions();

const prompt = new PromptTemplate({
  template: "Extract information from this text:\n{text}\n{format_instructions}",
  inputVariables: ["text"],
  partialVariables: { format_instructions: formatInstructions },
});

const model = new ChatGoogle({
    model: 'gemini-3-flash-preview',
    apiKey: process.env.GOOGLE_API_KEY
})

// prompt ka output -> model ka input, model ka output -> parser ka input
const chain = prompt.pipe(model).pipe(parser3)

const results = await chain.invoke({
    text: 'My name is Ali, and i lived in Pakistan/Karachi. I am 23 years old.'
})
console.log(results);



