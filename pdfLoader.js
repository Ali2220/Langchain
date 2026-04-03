import fs from "fs/promises";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { Document } from "@langchain/core/documents";

async function loadPdf(filePath){
    const buffer = await fs.readFile(filePath)
    const data = await pdfParse(buffer)
    
    const doc = new Document({
        pageContent: data.text,
        metadata: {
            source: filePath,
            type: "pdf",
            pages: data.numpages,
            info: data.info
        }
    })

    return [doc]
    
    
}

const pdfDocs = await loadPdf("resume.pdf")
console.log(pdfDocs[0].pageContent);
console.log(pdfDocs[0].metadata);


