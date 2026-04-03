import {Document} from '@langchain/core/documents'

async function loadWebPage(url) {
    let response = await fetch(url)
    let html = await response.text()
    
    const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
    
    const doc = new Document({
        pageContent: text,
        metadata: {
            sources: url,
            type: 'webPage',
            loadedAt: new Date().toISOString()
        }
    })

    return [doc]
    
}

const webDocs = await loadWebPage('https://en.wikipedia.org/wiki/LangChain')
console.log(webDocs[0].pageContent.substring(0, 500));
