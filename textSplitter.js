import {RecursiveCharacterTextSplitter} from '@langchain/textsplitters'

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 50,
    chunkOverlap: 10,
    separators: ["\n\n", "\n", " ", ""]
})

const text = "Pakistan ka capital Islamabad hai. Lahore historical city hai. Karachi business hub hai. Peshawar cultural city hai. Quetta beautiful city hai."

const chunks = await splitter.splitText(text)
console.log(chunks);


