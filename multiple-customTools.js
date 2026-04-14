import dotenv from "dotenv";
dotenv.config();
import { ChatGroq } from "@langchain/groq";
import fs from "fs/promises";

const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.1-8b-instant",
  temperature: 0.4,
});

async function readFile(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return content.substring(0, 500);
  } catch {
    return `Erro reading file`;
  }
}

async function writeFile(filePath, content) {
  try {
    await fs.writeFile(filePath, content);
    return `File written ${filePath}`;
  } catch {
    return "Error while writing file";
  }
}

function calculate(expression) {
  try {
    const result = eval(expression);
    return result;
  } catch {
    return `Error while calculating`;
  }
}

function getTime() {
  return new Date().toLocaleTimeString();
}

const modelWithAllTools = model.bindTools([
  {
    name: "read_file",
    description: "Read the file",
    schema: {
      type: "object",
      properties: {
        filePath: {
          type: "string",
          description: "Path to the file",
        },
      },
      required: ["filePath"],
    },
  },
  {
    name: "write_file",
    description: "Write the file",
    schema: {
      type: "object",
      properties: {
        filePath: {
          type: "string",
          description: "Path to the file",
        },
        content: {
          type: "string",
          description: "Content of the file",
        },
      },
      required: ["filePath", "content"],
    },
  },
  {
    name: "calculate",
    description: "calculate the expression",
    schema: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description: "Math Expression",
        },
      },
      required: ["expression"],
    },
  },
  {
    name: "get_time",
    description: "get current time",
    schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
]);

async function smartAgent(userInput) {
  const response = await modelWithAllTools.invoke(userInput);

  const toolCalls = response.additional_kwargs?.tool_calls;

  if (toolCalls && toolCalls.length > 0) {
    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      console.log(`ToolName: ${toolName}`);

      switch (toolName) {
        case "read_file":
          return await readFile(args.filePath);
        case "write_file":
          return await writeFile(args.filePath, args.content);
        case "calculate":
          return calculate(args.expression);
        case "get_time":
          return getTime();
        default:
          return "Unknown Tool";
      }
    }
  }

  return response.content
}

console.log(await smartAgent("What time is it?"));
console.log(await smartAgent("Calculate 15 * 8"));
console.log(await smartAgent("Read sample.txt"));
console.log(await smartAgent("Write 'This is a sample file' to sample.txt"));