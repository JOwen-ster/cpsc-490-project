import {
  GoogleGenerativeAI,
  SchemaType,
  GenerationConfig,
  ResponseSchema,
} from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const RESPONSE_SCHEMA: ResponseSchema = {
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
};

const GENERATION_CONFIG: GenerationConfig = {
  responseMimeType: "application/json",
  responseSchema: RESPONSE_SCHEMA,
};

export async function groupIssuesWithGemini(
  issues: { id: number; title: string; description: string | null }[],
  isLarge: boolean = false,
) {
  const processedIssues = isLarge
    ? issues.map((issue) => ({
        id: issue.id,
        title: issue.title,
        ...(issue.description
          ? {
              description:
                issue.description.length > 300
                  ? issue.description.substring(0, 300) + "..."
                  : issue.description,
            }
          : {}),
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

  try {
    // Try primary model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: GENERATION_CONFIG,
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    return JSON.parse(response.text());
  } catch (error: any) {
    console.error("Primary AI model failed, attempting fallback...", error);

    // Check if error is related to service availability or high traffic
    const isServiceError =
      error.message?.includes("503") ||
      error.message?.includes("Service Unavailable") ||
      error.message?.includes("high demand") ||
      error.message?.includes("overloaded");

    if (isServiceError) {
      try {
        // Use fallback model
        const fallbackModel = genAI.getGenerativeModel({
          model: "gemini-2.5-flash-lite",
          generationConfig: GENERATION_CONFIG,
        });

        const result = await fallbackModel.generateContent(prompt);
        const response = result.response;
        return JSON.parse(response.text());
      } catch (fallbackError: any) {
        console.error("Fallback AI model also failed:", fallbackError);
        throw new Error(
          "AI Grouping service is currently unavailable. Please try again later.",
        );
      }
    }

    throw error;
  }
}
