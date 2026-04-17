import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function groupIssuesWithGemini(
  issues: { id: number; title: string; description: string | null }[],
  isLarge: boolean = false
) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          groups: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                name: { type: SchemaType.STRING },
                description: { type: SchemaType.STRING },
                issueIds: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      id: { type: SchemaType.NUMBER },
                      priority: { type: SchemaType.NUMBER },
                    },
                    required: ["id", "priority"],
                  },
                },
              },
              required: ["name", "description", "issueIds"],
            },
          },
        },
        required: ["groups"],
      },
    },
  });

  const processedIssues = isLarge 
    ? issues.map(issue => ({
        id: issue.id,
        title: issue.title,
        ...(issue.description ? { 
          description: issue.description.length > 300 
            ? issue.description.substring(0, 300) + "..." 
            : issue.description 
        } : {})
      }))
    : issues;

  const prompt = `
    You are an expert project manager. I have a list of GitHub issues for a repository.
    Your task is to:
    1. Group these issues into logical categories (e.g., by feature, component, or type of work).
    2. For each group, prioritize the issues from FIRST to LAST (priority 1 being the most urgent/first to do).
    
    Here are the issues:
    ${JSON.stringify(processedIssues)}
    
    Return a JSON object with a "groups" array. Each group should have a "name", "description", and an "issueIds" array of objects containing the issue "id" and its "priority" within that group.
  `;

  const result = await model.generateContent(prompt);
  const response = result.response;
  return JSON.parse(response.text());
}
