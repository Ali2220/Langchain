import dotenv from "dotenv";
dotenv.config();
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { ChatGoogle } from "@langchain/google";
import { PromptTemplate } from "@langchain/core/prompts";

const model = new ChatGoogle({
  model: "gemini-3-flash-preview",
  temperature: 0.2,
});

const parser = StructuredOutputParser.fromNamesAndDescriptions({
  movie_name: "Movie Name",
  rating: "1-5 rating",
  positive_points: "Positive points of movie",
  negative_points: "Negatie points of movie",
  recommend: "Yes / No recommend",
});

const formatInstructions = parser.getFormatInstructions();
const prompt = new PromptTemplate({
  template: `Analyze this movie review and extract the information.

Review: {review}
{format_instructions}
`,
  inputVariables: ["review"],
  partialVariables: { format_instructions: formatInstructions },
});

const chain = prompt.pipe(model).pipe(parser);

const review = await chain.invoke({
  review: `I watched "The Legend of Maula Jatt" last night. 
Absolutely loved it! The acting was phenomenal, especially Fawad Khan. 
The cinematography was breathtaking. However, the movie was a bit too 
long at 3 hours. Some scenes could have been trimmed. But overall, 
it's a masterpiece! I would definitely recommend it to everyone.`,
});

console.log(review);
