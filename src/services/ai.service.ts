import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from "@google/genai";

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private ai: GoogleGenAI;

  constructor() {
    // Assuming process.env.API_KEY is available in the environment
    const apiKey = process.env['API_KEY'] || '';
    this.ai = new GoogleGenAI({ apiKey });
  }

  async estimateLoad(vehicleType: string, cargoDesc: string, distanceKm: number) {
    if (!cargoDesc) return null;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `I have a ${vehicleType}. I need to transport: "${cargoDesc}". Distance is ${distanceKm}km. 
                   Estimate the load percentage (0-100), estimated fuel cost in INR, and a safety rating (High/Medium/Low).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              loadPercentage: { type: Type.NUMBER },
              estimatedCost: { type: Type.NUMBER },
              safetyRating: { type: Type.STRING },
              advice: { type: Type.STRING }
            }
          }
        }
      });

      return JSON.parse(response.text);
    } catch (error) {
      console.error('AI Estimation failed', error);
      // Fallback mock response if AI fails or key is missing
      return {
        loadPercentage: 75,
        estimatedCost: distanceKm * 15,
        safetyRating: 'Medium',
        advice: 'Ensure cargo is strapped down securely. AI service unavailable.'
      };
    }
  }

  async assessLoad(vehicleType: string, material: string, weight: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Assess the suitability of a "${vehicleType}" carrying "${material}" (${weight}). Give a very short, 1-sentence assessment (max 15 words) regarding suitability or profitability.`,
      });
      return response.text.trim();
    } catch (e) {
      console.error('AI Assessment failed', e);
      return "AI Assessment unavailable.";
    }
  }

  async diagnoseIssue(symptoms: string) {
    if (!symptoms) return null;
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `I am a mechanic. The car has these symptoms: "${symptoms}". 
                   Provide a list of 3 probable causes and 1 recommended quick fix.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              causes: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendation: { type: Type.STRING },
              urgency: { type: Type.STRING }
            }
          }
        }
      });
      return JSON.parse(response.text);
    } catch (e) {
      return {
        causes: ['Battery Dead', 'Alternator Failure', 'Loose Wiring'],
        recommendation: 'Check voltage with multimeter.',
        urgency: 'Medium'
      };
    }
  }
}