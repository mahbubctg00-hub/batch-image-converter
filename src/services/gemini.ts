import { GoogleGenAI } from "@google/genai";

// Initialize the client with the API key
// The key is automatically injected into process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function convertImageToSquare(base64Image: string, mimeType: string): Promise<string> {
  try {
    // Remove the data URL prefix if present (e.g., "data:image/png;base64,")
    const base64Data = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: 'Generate a version of this image with a 1:1 aspect ratio. Maintain the original style, subject, and composition as closely as possible, extending the background or cropping intelligently if necessary.',
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    // Extract the generated image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image generated in the response.");
  } catch (error) {
    console.error("Error converting image:", error);
    throw error;
  }
}
