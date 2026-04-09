// User Query → smartAgent()
//     ↓
// Print query
//     ↓
// Tool list string banai (Object.entries + map + join)
//     ↓
// Prompt banaya (rules + tools + format)
//     ↓
// Gemini API call → response
//     ↓
// Decision print kiya
//     ↓
// Check: startsWith "NO_TOOL|"?
//     ├─ Yes → split("|")[1] → return answer
//     └─ No → split("|") → [toolName, param]
//             ↓
//         Check tools[toolName] exists?
//             ├─ Yes → param exists and not empty?
//             │       ├─ Yes → tools[toolName].execute(param)
//             │       └─ No → tools[toolName].execute()
//             └─ No → "Tool not found"
//     ↓
// Result return hua → console.log se print


import dotenv from "dotenv";
dotenv.config();
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

// Weather Api (mock)
async function getWeather(city) {
  const weatherData = {
    karachi: "30°C, sunny",
    lahore: "28°C, hazy",
    islamabad: "22°C, clear",
    default: "25°C, partly cloudy",
  };

  return weatherData[city.toLowerCase()] || weatherData.default;
}

async function webSearch(query) {
  const searchResults = {
    "prime minister of pakistan":
      "Shehbaz Sharif is the current Prime Minister of Pakistan.",
    "population pakistan":
      "Pakistan's population is approximately 240 million.",
    default: "No specific information found.",
  };

  for (let key in searchResults) {
    if (query.toLowerCase().includes(key)) {
      return searchResults[key];
    }
  }

  return searchResults.default;
}

const tools = {
  calculator: {
    description: "Calculate math expressions",
    execute: async (expr) => {
      try {
        const result = eval(expr);
        return `Result: ${result}`;
      } catch {
        return "Invalid Expression";
      }
    },
  },
  weather: {
    description: "Get weather for a city. Parameter: city name",
    execute: async (city) => {
      const weather = await getWeather(city);
      return `Weather: ${weather} in City: ${city}`;
    },
  },

  search: {
    description: "Search the web for information. Parameter: search query",
    execute: async (query) => {
      return await webSearch(query);
    },
  },

  time: {
    description: "Get current time",
    execute: async () => {
      return new Date().toLocaleTimeString();
    },
  },
};

async function smartAgent(query) {
  console.log(`User Query ${query}`);

  let toolList = Object.entries(tools)
    .map(([name, tool]) => {
      return `${name}: ${tool.description}`;
    })
    .join("\n");

  const prompt = `You decide which tool to use.

Tools:
${toolList}

User: "${query}"

Rules:
- For math (+, -, *, /, calculate) → use calculator, provide expression
- For weather → use weather, provide city name
- For asking about facts, news, information → use search
- For time → use time

Response format exactly:
TOOL_NAME|parameter

Example: calculator|25*4
Example: weather|karachi
Example: search|pakistan population
Example: time|

If no tool needed, reply: NO_TOOL|your answer`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const decision = response.text.trim();
  console.log(`AI Decision: ${decision}`);

  if (decision.startsWith("NO_TOOL|")) {
    return decision.split("|")[1];
  }

  const [toolName, param] = decision.split("|");

  if (tools[toolName]) {
    if (param && param.trim()) {
      return await tools[toolName].execute(param);
    } else {
      return await tools[toolName].execute();
    }
  }

  return "Tool not found. Please try again.";
}

console.log(await smartAgent("What is 100 / 4?"));
console.log(await smartAgent("Weather in Lahore?"));
console.log(await smartAgent("Who is the prime minister of pakistan?"));
console.log(await smartAgent("What time is it?"));
console.log(await smartAgent("Hello!"));
