import dotenv from "dotenv";
dotenv.config();
import { GoogleGenAI } from "@google/genai";
import { ChromaClient } from "chromadb";

// 1. Initialize Google AI
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// 2. Embedding function
async function getEmbedding(text) {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
  });
  return response.embeddings[0].values;
}

// 3. ChromaDB setup
const chroma = new ChromaClient({ path: "http://localhost:8000" });

let collection;
try {
  collection = await chroma.getCollection({ name: "my_knowledge" });
} catch {
  collection = await chroma.createCollection({ name: "my_knowledge" });
}

// 4. Text store karne ka function
async function storeText(text, topic) {
  const embedding = await getEmbedding(text);
  const id = Date.now().toString(); // Unique ID

  await collection.add({
    ids: [id],
    embeddings: [embedding],
    metadatas: [{ topic: topic, timestamp: new Date().toISOString() }],
    documents: [text],
  });

  console.log(`✅ Stored: "${text.substring(0, 50)}..."`);
  return id;
}

// 5. Store karo
await storeText("Pakistan ka capital Islamabad hai", "capital");
await storeText("Lahore Punjab ka sab se bara city hai", "city");
await storeText("Karachi business hub hai", "economy");
await storeText("Biryani Pakistani famous dish hai", "food");
await storeText("Cricket Pakistan mein popular sport hai", "sports");

console.log("\n📦 5 documents stored in ChromaDB!");

async function searchSimilar(query) {
  const queryEmbedding = await getEmbedding(query);

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: 2,
  });

  for (let i = 0; i < results.documents[0].length; i++) {
    console.log(`${i + 1}. ${results.documents[0][i]}`);
    console.log(
      `   Similarity score: ${(1 - results.distances[0][i]).toFixed(3)}\n`,
    );
  }

  return results.documents[0];
}

await searchSimilar("What is the capital of Pakistan?");
await searchSimilar("Tell me about food in Pakistan");
await searchSimilar("Which city is business hub?");
