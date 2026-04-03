import fs from "fs/promises";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { type } from "os";

// document loader
async function load(filePath, type = "text") {
  let text;
  if (type === "text") {
    text = await fs.readFile(filePath, "utf-8");
  } else if (type === "pdf") {
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);
    text = data.text;
  }

  return [
    new Document({
      pageContent: text,
      metadata: {
        sources: filePath,
        type: type,
      },
    }),
  ];
}

// split document
async function splitFunction(filePath, fileType) {
  let docs = await load(filePath, fileType);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 80,
    chunkOverlap: 20,
    separators: ["\n\n", "\n", ".", "!", "?", ",", " ", ""],
  });

  const chunks = await splitter.splitDocuments(docs);

  return chunks;
}

const allChunks = await splitFunction("pakistan-info.txt");
allChunks.forEach(function (chunk) {
  console.log(chunk.pageContent);
});
