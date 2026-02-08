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
      const prompt = `I have a ${vehicleType}. I need to transport: "${cargoDesc}". Distance is ${distanceKm}km in India.
      1. Search for current logistics rates (Porter, Borzo, Uber Freight benchmarks) for this vehicle type and distance.
      2. Estimate the load percentage (0-100).
      3. Estimate fuel cost in INR.
      4. Estimate a fair Market Price to charge in INR based on the search results.
      5. Provide a safety rating (High/Medium/Low) and advice.
      
      Output ONLY a JSON object with this structure:
      {
        "loadPercentage": number,
        "estimatedFuelCost": number,
        "marketPrice": number,
        "safetyRating": "string",
        "advice": "string",
        "marketComparison": "string (e.g. 'Competitors charge approx ₹X-₹Y')"
      }`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }] // Enable Grounding for real-time price checks
        }
      });

      let text = response.text || '';
      // Clean up markdown if present
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        return JSON.parse(text.substring(jsonStart, jsonEnd + 1));
      }
      throw new Error('No valid JSON found in response');
    } catch (error) {
      console.error('AI Estimation failed', error);
      // Fallback mock response if AI fails or key is missing
      return {
        loadPercentage: 75,
        estimatedFuelCost: distanceKm * 8,
        marketPrice: distanceKm * 25,
        safetyRating: 'Medium',
        advice: 'Ensure cargo is strapped down securely. Real-time market data unavailable.',
        marketComparison: 'Offline estimate'
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