import dotenv from "dotenv";
dotenv.config();
import { ChatGoogle } from "@langchain/google";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";

async function analyzeResume(resumeText) {
  const model = new ChatGoogle({
    model: "gemini-3-flash-preview",
    temperature: 0.3,
  });

  // Sirf EK parser - Jo saari information ek saath le lega
  const parser = StructuredOutputParser.fromNamesAndDescriptions({
    // Extraction wali fields
    skills: "Array of technical and soft skills",
    experience_years: "Total years of professional experience",
    education: "Highest education degree and institution",
    top_strengths: "Array of top 3 strengths",
    areas_for_improvement: "Array of areas that need improvement",

    // Recommendations wali fields
    job_titles: "Array of 3 recommended job titles",
    salary_range: "Expected salary range in USD",
    reason: "Why these jobs are suitable",
    next_steps: "Array of suggested next steps for career growth",
  });

  const formatInstructions = parser.getFormatInstructions();

  // Sirf EK prompt - Jo saari information ek saath nikal lega
  const prompt = new PromptTemplate({
    template: `
    Analyze this resume and provide both extracted information AND job recommendations.
    
    Resume: {resume}
    
    Please do the following:
    1. Extract key information from the resume
    2. Based on the extracted information, provide job recommendations
    
    {format_instructions}
  `,
    inputVariables: ["resume"],
    partialVariables: { format_instructions: formatInstructions },
  });

  // Sirf EK chain
  const chain = prompt.pipe(model).pipe(parser);

  // Ek hi baar invoke karna hai
  const result = await chain.invoke({
    resume: resumeText,
    format_instructions: parser.getFormatInstructions(),
  });

  console.log(result);
}

// Test
const resume = `
Name: Ahmed Raza
Experience: 5 years as Full Stack Developer
Skills: JavaScript, React, Node.js, Python, MongoDB, Team Leadership
Education: BS Computer Science from NUST (2018)
Projects: Built e-commerce platform with 10k users
Achievements: Led team of 5 developers, Reduced load time by 40%
`;

analyzeResume(resume);
