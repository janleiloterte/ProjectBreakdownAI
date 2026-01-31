
import { GoogleGenAI, Type } from "@google/genai";
import { AssignmentInput, ProjectBreakdown } from "../types";

export const generateBreakdown = async (input: AssignmentInput): Promise<ProjectBreakdown> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const now = new Date().toLocaleString();
  
  const systemInstruction = `
    You are an expert academic and professional project manager. 
    Your task is to take an assignment description (text and/or file) and a specific final deadline (date and time).
    Current time is: ${now}.
    
    1. FIRST, analyze the scope: Calculate the total estimated hours needed and compare it to the remaining time until ${input.deadline}.
    2. FEASIBILITY: Determine if the project can realistically be finished by a single person working at a sustainable pace (approx 6-8 hours per day). 
       - Set 'isRealistic' to true if it fits comfortably. 
       - Set 'isRealistic' to false if it requires extreme "crunch" or is mathematically impossible.
    3. STRATEGY: 
       - If realistic: Break it down efficiently to finish slightly early.
       - If unrealistic: Provide a 'feasibilityNote' explaining the risk (e.g., "This requires 40 hours of work in 2 days"), but still provide a high-intensity breakdown showing how to prioritize the most critical parts.
    
    Each milestone must have:
    - A specific title
    - A clear description
    - A deadline (YYYY-MM-DD HH:mm)
    - Estimated hours
    - Priority level
    
    The distribution of work should follow a logical flow (e.g., Research -> Drafting -> Review -> Submission).
  `;

  const contents: any[] = [{ text: `Assignment Details: ${input.text}\nFinal Deadline: ${input.deadline}` }];
  
  if (input.file) {
    contents.push({
      inlineData: {
        data: input.file.data,
        mimeType: input.file.mimeType
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: contents.map(c => typeof c === 'string' ? { text: c } : c) },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          projectName: { type: Type.STRING },
          totalEstimatedHours: { type: Type.NUMBER },
          isRealistic: { type: Type.BOOLEAN },
          feasibilityNote: { type: Type.STRING, description: "Advice or warning about the timeline." },
          milestones: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                deadline: { type: Type.STRING, description: "Format: YYYY-MM-DD HH:mm" },
                estimatedHours: { type: Type.NUMBER },
                priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] }
              },
              required: ['id', 'title', 'description', 'deadline', 'estimatedHours', 'priority']
            }
          }
        },
        required: ['projectName', 'totalEstimatedHours', 'isRealistic', 'feasibilityNote', 'milestones']
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  return JSON.parse(text) as ProjectBreakdown;
};
