import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env['API_KEY'] || '' });
  }

  async analyzeSeason(imageBase64: string): Promise<any> {
    const prompt = `Analyze this person's skin undertone, eye color, and hair color strictly according to Armochromia theory. 
    Determine their seasonal color palette (Spring, Summer, Autumn, Winter) and specific sub-season (e.g., Deep Autumn, Light Summer).
    Provide a list of recommended colors (hex codes) and a brief explanation.
    Return JSON.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageBase64
            }
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            season: { type: Type.STRING },
            subSeason: { type: Type.STRING },
            description: { type: Type.STRING },
            recommendedColors: {
              type: Type.ARRAY,
              items: { type: Type.STRING } // hex codes
            },
            bestMetals: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  }

  async describeImage(imageBase64: string, prompt: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }
          ]
        }
      });
      return response.text || '';
    } catch (e) {
      console.warn('Description generation failed', e);
      return '';
    }
  }

  async describeClothing(imageBase64: string): Promise<string> {
    return this.describeImage(imageBase64, "Describe this clothing item in detail for a fashion visualizer. Include color, fabric texture, fit, neckline, and key details. Keep it concise.");
  }

  async generateTryOn(personImageBase64: string, clothingImageBase64: string): Promise<string> {
    // 1. Describe both images to provide semantic context to the generator
    const [personDesc, clothingDesc] = await Promise.all([
      this.describeImage(personImageBase64, "Describe the person in this photo (gender, body type, pose, hair) and the background. Concise."),
      this.describeImage(clothingImageBase64, "Describe this clothing item (type, color, material, style). Concise.")
    ]);

    // 2. Construct Prompt
    const prompt = `A high-quality, photorealistic fashion shot of ${personDesc} wearing ${clothingDesc}. 
    Maintain the person's exact pose, facial features, and the original background from the reference image.
    The clothing should fit naturally. 8k resolution.`;

    // 3. Generate with Imagen 4.0 using the person's photo as a reference image
    try {
      const response = await this.ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        image: {
          imageBytes: personImageBase64,
          mimeType: 'image/jpeg'
        },
        config: {
          numberOfImages: 1,
          aspectRatio: '3:4',
          outputMimeType: 'image/jpeg'
        }
      } as any);

      if (response.generatedImages && response.generatedImages.length > 0) {
        return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
      }
      throw new Error('No images generated');
    } catch (e: any) {
      console.error('Generation Error:', e);
      throw new Error(e.message || 'Failed to generate try-on');
    }
  }

  async suggestOutfit(wardrobeItems: any[], occasion: string, weather: string): Promise<any> {
    const itemsJson = JSON.stringify(wardrobeItems.map(i => ({ id: i.id, type: i.category, tags: i.tags, color: i.color })));
    
    const prompt = `Given these wardrobe items: ${itemsJson}.
    Suggest one complete outfit for a ${occasion} occasion where the weather is ${weather}.
    Select specific Item IDs from the list. Explain why it works.
    Return JSON.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topId: { type: Type.STRING },
            bottomId: { type: Type.STRING },
            shoeId: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            styleTip: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  }
}