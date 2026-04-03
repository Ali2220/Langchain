import fs from "fs/promises";
import { Document } from "@langchain/core/documents";

async function loadTextFile(filePath) {
  const text = await fs.readFile("sample.txt", "utf-8");

  const doc = new Document({
    pageContent: text,
    metadata: {
      source: filePath,
      type: "text",
      loadedAt: new Date().toISOString(),
    },
  });

  return [doc];
}

const docs = await loadTextFile("sample.txt");
console.log(docs[0].pageContent);
console.log(docs[0].metadata);
