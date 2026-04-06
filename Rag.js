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

let collection;
try {
  collection = await chroma.getCollection({
    name: "my_knowledge",
    embeddingFunction: null,
  });
} catch {
  collection = await chroma.createCollection({
    name: "my_knowledge",
    embeddingFunction: null,
  });
}

async function getEmbedding(text) {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
  });

  return response.embeddings[0].values;
}

// add knowledge
async function addKnowledge(text, topic) {
  const embedding = await getEmbedding(text);
  const id = Date.now().toString();

  await collection.add({
    ids: [id],
    embeddings: [embedding],
    metadatas: [{ topic: topic }],
    documents: [text],
  });

  console.log(`✅ Added: ${text.substring(0, 50)}...`);
}

async function searchKnowledge(query, nResults) {
  const queryEmbedding = await getEmbedding(query);

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: nResults,
  });

  return results.documents[0] || [];
}

async function askQuestion(question) {
  const relevantDocs = await searchKnowledge(question);

  if (relevantDocs.length === 0) {
    console.log("No relevant information found!");
    return;
  }

  const context = relevantDocs.join("\n\n");

  const prompt = `Answer based on this context:
  
Context: ${context}

Question: ${question}

Answer in Roman Urdu:`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  const answer = response.text;
  console.log(`\n💡 Answer: ${answer}`);
  console.log(`\n📚 Sources used: ${relevantDocs.length}`);

  return answer;
}

async function main() {
  await addKnowledge(
    "Pakistan ka capital Islamabad hai. Yeh beautiful city hai.",
    "capital",
  );
  await addKnowledge(
    "Lahore Punjab ka sab se bara city hai. Yahan Badshahi mosque hai.",
    "city",
  );
  await addKnowledge(
    "Karachi Pakistan ka sab se bara city hai. Business hub hai.",
    "economy",
  );
  await addKnowledge(
    "Biryani famous Pakistani dish hai. Spicy aur tasty hoti hai.",
    "food",
  );
  await addKnowledge(
    "Cricket Pakistan ka sab se popular sport hai. World Cup jeeta hai.",
    "sports",
  );
  await addKnowledge("Urdu Pakistan ki national language hai.", "language");

  //   ====================================================
  console.log("\n" + "=".repeat(50));

  await askQuestion("Pakistan ka capital kya hai?");
  await askQuestion("Pakistan mein konsa sport popular hai?");
  await askQuestion("Karachi kis liye famous hai?");
  await askQuestion("Pakistani food ke baare mein batao");
}

main()