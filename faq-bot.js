// getEmbedding() → text ko vector mein convert karega
//     ↓
// addDocumentToDatabase() → document save karega
//     ↓
// searchSimilarDocuments() → similar documents dhondhega
//     ↓
// storeFAQ() → FAQs ko database mein store karega
//     ↓
// askFAQ() → user question ka jawab dega

import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";
import { ChromaClient } from "chromadb";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const chroma = new ChromaClient({
  host: "localhost",
  port: 8000,
});

let collection;

async function getEmbedding(text) {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
  });

  return response.embeddings[0].values;
}

async function storeFAQ(questionsList) {
  console.log("📚 Storing FAQs in database...");

  for (let i = 0; i < questionsList.length; i++) {
    let currentFAQ = questionsList[i];
    let fullText = "Q: " + currentFAQ.question + "\nA: " + currentFAQ.answer;
    await addDocumentToDatabase(fullText, "faq", currentFAQ.category);
  }

  console.log("✅ Done! Stored " + questionsList.length + " FAQs");
}

async function askFAQ(userQuestion) {
  console.log("🔍 Searching answer for: " + userQuestion);

  let matchedResults = await searchSimilarDocuments(userQuestion, 1);

  if (matchedResults.length === 0) {
    return "❌ Sorry, I don't have an answer for that question.";
  }

  let bestMatch = matchedResults[0];
  let similarityScore = bestMatch.similarity;

  if (similarityScore < 0.5) {
    return "❌ Sorry, I don't have an answer for that question.";
  }

  let storedText = bestMatch.text;
  let answerMatch = storedText.match(/A: (.*)/);

  if (answerMatch !== null) {
    let finalAnswer = answerMatch[1];
    return "💡 Answer: " + finalAnswer;
  } else {
    return "💡 Answer: " + storedText;
  }
}

async function addDocumentToDatabase(text, type, category) {
  let embedding = await getEmbedding(text);

  await collection.add({
    ids: ["faq_" + Date.now() + "_" + Math.random()],
    embeddings: [embedding],
    documents: [text],
    metadatas: [{ type: type, category: category }],
  });
}

async function searchSimilarDocuments(query, topK) {
  let queryEmbedding = await getEmbedding(query);

  let results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
  });

  let documents = results.documents[0] || [];
  let distances = results.distances[0] || [];
  let metadatas = results.metadatas[0] || [];

  let finalResults = [];
  for (let i = 0; i < documents.length; i++) {
    finalResults.push({
      text: documents[i],
      similarity: 1 - distances[i],
      metadata: metadatas[i],
    });
  }

  return finalResults;
}

async function main() {
  try {
    collection = await chroma.getCollection({ name: "faq_collection" });
  } catch {
    collection = await chroma.createCollection({ name: "faq_collection" });
  }

  let myFAQs = [
    {
      question: "What is your return policy?",
      answer: "30 days return with original receipt.",
      category: "policy",
    },
    {
      question: "How to track order?",
      answer: "Use tracking link sent via email.",
      category: "shipping",
    },
    {
      question: "Do you ship internationally?",
      answer: "Yes, we ship to over 50 countries.",
      category: "shipping",
    },
  ];

  await storeFAQ(myFAQs);

  console.log("\n" + "=".repeat(50) + "\n");

  let answer1 = await askFAQ("Can I return my product?");
  console.log(answer1);

  let answer2 = await askFAQ("How can I track my order?");
  console.log(answer2);

  let answer3 = await askFAQ("International shipping?");
  console.log(answer3);
}

main();
