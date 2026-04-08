import dotenv from "dotenv";
dotenv.config();
import { GoogleGenAI } from "@google/genai";
import { ChromaClient } from "chromadb";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const chroma = new ChromaClient({
  path: "http://localhost:8000",
});

async function getEmbedding(text) {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
  });

  return response.embeddings[0].values;
}

let collection;
try {
  collection = await chroma.getCollection({ name: "my_knowledge" });
} catch {
  collection = await chroma.createCollection({ name: "my_knowledge" });
}

async function retrive(query, topK = 1) {
  const queryEmbedding = await getEmbedding(query);

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
  });

  const documents = results.documents[0] || [];
  const distances = results.distances[0] || [];
  const metadatas = results.metadatas[0] || [];

  const retrived = documents.map((doc, i) => ({
    text: doc,
    similarity: 1 - distances[i], // 0 se 1, jitna zyada utna similar
    metadata: metadatas[i],
  }));

  console.log("✅ Answer of retrive function: ",retrived[0].text);
  
  return retrived;
}

// Add data to DB
async function addSampleData(id, text, metadata = {}) {
  const embedding = await getEmbedding(text);

  await collection.add({
    ids: [id],
    embeddings: [embedding],
    documents: [text],
    metadatas: [metadata],
  });
}

async function main() {
    await addSampleData("1", "hi mera naam ali hai", {type: "self"})
    await addSampleData("2", "mere dost ka naam umer hai", {type: "friend"})
    await addSampleData("3", "meri wife ka naam Hunza hai", {type: "family"})

    // retrieve
    await retrive("mere dost k naam ki hai ?")

}

main()