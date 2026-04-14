import dotenv from "dotenv";
dotenv.config();
import { ChatGroq } from "@langchain/groq";

const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.1-8b-instant",
  temperature: 0.2,
});

const weatherData = {
  karachi: "32°C, humid",
  lahore: "28°C, smoggy",
  islamabad: "22°C, clear",
  default: "25°C, partly cloudy",
};

function getWeather(city) {
  const weather = weatherData[city.toLowerCase()] || weatherData.default;
  return `Weather in city: ${city}: weather`;
}

const modelWithWeather = model.bindTools([
  {
    name: "getWeather",
    description: "get current weather of a specific city",
    schema: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "City name (e.g., Karachi, Lahore, Islamabad)",
        },
      },
      required: ["city"],
    },
  },
]);

async function weatherAgent(userInput) {
  const response = await modelWithWeather.invoke(userInput);

  const toolCalls = response.additional_kwargs?.tool_calls;

  if (toolCalls && toolCalls.length > 0) {
    for (const toolCall of toolCalls) {
      if (toolCall.function.name === "getWeather") {
        const args = JSON.parse(toolCall.function.arguments);
        return getWeather(args.city);
      }
    }
  }

  return response.content;
}

console.log(await weatherAgent("What's the weather in Karachi?"));
console.log(await weatherAgent("Lahore mein mausam kaisa hai?"));