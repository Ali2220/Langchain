import dotenv from "dotenv";
dotenv.config();
import { ChatGoogle } from "@langchain/google";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";

const model = new ChatGoogle({
  model: "gemini-3-flash-preview",
  temperature: 0.7,
});

const parser = new StringOutputParser();

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You are a recipe assistant. Remember user preferences Suggest recipes based on dietary restrictions Avoid repeating previous recommendations Track favorite dishes",
  ],
  new MessagesPlaceholder("history"),
  ["human", "{input}"],
]);

const chain = prompt.pipe(model).pipe(parser);

// Session ka matlab hai ek customer ki poori conversation ka record.
const sessions = {};

async function chat(sessionId, userInput) {
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      history: new InMemoryChatMessageHistory(),
      dietaryPreference: null,
      favoriteDishes: [],
      recommendedRecipes: [],
    };
  }

  const session = sessions[sessionId];

  const oldMessages = await session.history.getMessages();

  const lowerInput = userInput.toLowerCase();
  if (lowerInput.includes("vegetarian")) {
    session.dietaryPreference = "vegetarian";
  } else if (lowerInput.includes("vegan")) {
    session.dietaryPreference = "vegan";
  } else if (lowerInput.includes("gluten-free")) {
    session.dietaryPreference = "gluten-free";
  }

  let finalInput = userInput;

  if (session.dietaryPreference) {
    finalInput += `\n(User ki diet: ${session.dietaryPreference})`;
  }

  if (session.favoriteDishes.length > 0) {
    finalInput += `\n(Pasand ki dishes: ${session.favoriteDishes.join(", ")})`;
  }

  if (session.recommendedRecipes.length > 0) {
    finalInput += `\n(Pehle suggest ki gayi: ${session.recommendedRecipes.join(", ")})`;
    finalInput += `\nYe dobara suggest mat karo, kuch naya batao.`;
  }

  const response = await chain.invoke({
    input: finalInput,
    history: oldMessages,
  });

  const recipeMatch = response.match(/\*\*([^*]+)\*\*/);
  if (recipeMatch && !session.recommendedRecipes.includes(recipeMatch[1])) {
    session.recommendedRecipes.push(recipeMatch[1]);
  }

  const liked =
    lowerInput.includes("loved") ||
    lowerInput.includes("awesome") ||
    lowerInput.includes("delicious");

  if (liked && session.recommendedRecipes.length > 0) {
    const lastRecipe =
      session.recommendedRecipes[session.recommendedRecipes.length - 1];
    if (lastRecipe && !session.favoriteDishes.includes(lastRecipe)) {
      session.favoriteDishes.push(lastRecipe);
      console.log(`⭐ Favorite mein add hui: ${lastRecipe}`);
    }
  }

  await session.history.addUserMessage(userInput);
  await session.history.addAIMessage(response);

  return response;
}

async function testKaro() {
  const sessionId = "cook_123";

  console.log("🍳 RECIPE ASSISTANT");
  console.log("=".repeat(60));

  const messages = [
    "I am vegetarian. Suggest a dinner recipe.",
    "I loved the pasta! Any more Italian dishes?",
    "What about something spicy for lunch?",
    "Do you remember my dietary preference?",
    "Suggest something new that I haven't tried yet.",
  ];

  let count = 1;

  for (const msg of messages) {
    console.log(`\n[${count}] 👤: ${msg}`);
    const reply = await chat(sessionId, msg);
    console.log(`🤖: ${reply}`);
    console.log("-".repeat(60));
    count++;
  }

  const session = sessions[sessionId];
  console.log("\n📊 SUMMARY");
  console.log("=".repeat(60));
  console.log(`Diet: ${session.dietaryPreference || "Nahi batai"}`);
  console.log(
    `Favorite dishes: ${session.favoriteDishes.join(", ") || "Koi nahi"}`,
  );
  console.log(`Total recipes try ki: ${session.recommendedRecipes.length}`);
  console.log("=".repeat(60));
}

// Chalao
testKaro();
