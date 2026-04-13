import dotenv from "dotenv";
dotenv.config();
import { ChatGroq } from "@langchain/groq";

const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.1-8b-instant",
  temperature: 0.1,
});

function calculate(expression) {
  try {
    const result = eval(expression);
    return `Result: ${result}`;
  } catch {
    return `Invalid Expression...`;
  }
}

const modelWithCalculator = model.bindTools([
  {
    name: "calculate",
    description: "Calculate a mathematical expression",
    schema: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description: "Mathematical expression to evaluate",
        },
      },
      required: ["expression"],
    },
  },
]);

async function calculatorAgent(userInput) {
  const response = await modelWithCalculator.invoke(userInput);

  const toolCalls = response.additional_kwargs?.tool_calls;

  if (toolCalls && toolCalls.length > 0) {
    for (const toolCall of toolCalls) {
      if (toolCall.function.name === "calculate") {
        const args = JSON.parse(toolCall.function.arguments);
        const result = calculate(args.expression);
        return result
      }
    }
  }

  return response.content;
}

console.log(await calculatorAgent("What is 25 multiplied by 4?"));
