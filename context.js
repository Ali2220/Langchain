import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";
import { ChromaClient } from "chromadb";

// --------------------
// 1. Init
// --------------------
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const chroma = new ChromaClient({
  host: "localhost",
  port: 8000,
});

let collection;

// --------------------
// 2. Embedding
// --------------------
async function getEmbedding(text) {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
  });

  return response.embeddings[0].values;
}

// --------------------
// 3. Setup DB (RESET)
// --------------------
async function setupDB() {
  try {
    await chroma.deleteCollection({ name: "my_knowledge" });
  } catch (e) {
    // ignore if not exists
  }

  collection = await chroma.createCollection({
    name: "my_knowledge",
    embeddingFunction: null, // IMPORTANT
  });
}

// --------------------
// 4. Insert Data
// --------------------
async function addData(id, text, metadata = {}) {
  const embedding = await getEmbedding(text);

  await collection.add({
    ids: [id], // MUST be string
    embeddings: [embedding],
    documents: [text],
    metadatas: [metadata],
  });
}

// --------------------
// 5. Retrieve
// --------------------
async function retrieve(query, topK = 3) {
  const queryEmbedding = await getEmbedding(query);

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
  });

  const documents = results.documents?.[0] || [];
  const distances = results.distances?.[0] || [];
  const metadatas = results.metadatas?.[0] || [];

  const retrieved = documents.map((doc, i) => ({
    text: doc,
    similarity: 1 - distances[i],
    metadata: metadatas[i],
  }));

  return retrieved;
}

// --------------------
// 6. RAG Answer
// --------------------
async function answerWithRetrieval(question) {
  const relevant = await retrieve(question, 3);

  if (relevant.length === 0 || relevant[0].similarity < 0.6) {
    console.log("\n💡 Answer: Mujhe nahi pata");
    return "Mujhe nahi pata";
  }

  // Build context
  const context = relevant
    .map((item, i) => `[${i + 1}] ${item.text}`)
    .join("\n");

  const prompt = `
Tum ek helpful assistant ho.
Sirf diye gaye context se jawab do.
Agar jawab context mein na ho to bolo: "Mujhe nahi pata".

Context:
${context}

Question:
${question}

Answer:
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  const answer = response.text || "No response";

  console.log("\n❓ Question:", question);
  console.log("💡 Answer:", answer);

  return answer;
}

// --------------------
// 7. Main Flow
// --------------------
async function main() {
  await setupDB();

  // Insert data
  await addData(
    "1",
    "Pakistan ka capital Islamabad hai. Yeh city Margalla Hills mein located hai.",
    { type: "pakistan" },
  );

  await addData(
    "2",
    "Lahore Punjab ka cultural capital hai. Yahan Badshahi Mosque aur Lahore Fort hai.",
    { type: "lahore" },
  );

  await addData(
    "3",
    "Karachi Pakistan ka sab se bara city hai. Business aur industrial hub hai.",
    { type: "karachi" },
  );

  await addData(
    "4",
    "Biryani Pakistani dish hai. Rice, meat aur spices se banti hai.",
    { type: "food" },
  );

  await addData(
    "5",
    "Cricket Pakistan mein sab se popular sport hai. 1992 mein World Cup jeeta.",
    { type: "sports" },
  );

  await addData(
    "6",
    "Urdu national language hai. English bhi official language hai.",
    { type: "language" },
  );

  await addData(
    "7",
    "Indus River Pakistan ki longest river hai. 3000 km lambi hai.",
    { type: "river" },
  );

  await addData(
    "8",
    "k2 2nd largest mountain hai or ye pakistan ke north mai hai.",
    { type: "river" },
  );

  // Queries
  await answerWithRetrieval("Pakistan ka capital kya hai?");
  await answerWithRetrieval("Biryani kya hoti hai?");
  await answerWithRetrieval("Karachi kya hai?");
  await answerWithRetrieval("K2 kahan hai?"); // not in DB
}

// Run
main();
