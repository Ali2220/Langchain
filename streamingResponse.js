import dotenv from "dotenv";
dotenv.config();
import { ChatGroq } from "@langchain/groq";

const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.1-8b-instant",
    temperature: 0.5
})

const stream = await model.stream('Write a 2-line poem about Pakistan in Roman Urdu.')
for await (const chunk of stream) {
    const content = chunk.content
    process.stdout.write(content)
}

