import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy_key" });

export const analyzeJobMatch = async (job, talent) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
      Analyze the match between this job and this candidate.
      
      Job:
      Title: ${job.title}
      Company: ${job.company}
      Description: ${job.description}
      Requirements: ${job.requirements.join(", ")}
      
      Candidate:
      Name: ${talent.name}
      Role: ${talent.role}
      Experience: ${talent.experience}
      Skills: ${talent.skills.join(", ")}
      Bio: ${talent.bio}
      
      Provide a match score (0-100) and a brief reasoning.
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          reasoning: { type: Type.STRING },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          gaps: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["score", "reasoning", "strengths", "gaps"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const getCareerAdvice = async (query, talent) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
      You are a career coach for TokenJobs. 
      Candidate: ${talent.name}, Role: ${talent.role}, Experience: ${talent.experience}, Skills: ${talent.skills.join(", ")}.
      User Question: ${query}
    `,
    config: {
      systemInstruction: "You are a professional, encouraging, and highly strategic career coach. Keep responses concise and actionable."
    }
  });

  return response.text;
};
