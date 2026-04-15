import dotenv from "dotenv";
dotenv.config();
import { ChatGroq } from "@langchain/groq";

const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "moonshotai/kimi-k2-instruct",
  temperature: 0.3,
});

function calculate(expression) {
  try {
    const result = eval(expression);
    return `Result: ${result}`;
  } catch {
    return `Invalid Expression`;
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

async function streamWithTools(userInput) {
  const stream = await modelWithCalculator.stream(userInput);

  let fullResponse = "";
  let toolCalled = false;

  for await (const chunk of stream) {
    const toolCalls = chunk.additional_kwargs?.tool_calls;

    if (toolCalls && toolCalls.length > 0 && !toolCalled) {
      toolCalled = true;

      for (const toolCall of toolCalls) {
        if (toolCall.function.name === "calculate") {
          let args = JSON.parse(toolCall.function.arguments);
          let result = calculate(args.expression);
          console.log(`\n[Using calculator: ${args.expression} = ${result}]\n`);
          fullResponse += ` ${result}`;
          process.stdout.write(` ${result}`);
        }
      }
    } else if (chunk.content) {
      process.stdout.write(chunk.content);
      fullResponse += chunk.content;
    }
  }

  console.log("\n");
  return fullResponse;
}

await streamWithTools("What is 250 * 4?");
await streamWithTools("Calculate 1000 divided by 8");
