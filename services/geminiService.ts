import { GoogleGenAI, Type } from "@google/genai";
import { SnowSettings, DEFAULT_SETTINGS } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const interpretWeatherCommand = async (prompt: string, currentSettings: SnowSettings): Promise<SnowSettings> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User request: "${prompt}".
      
      Current settings: ${JSON.stringify(currentSettings)}.
      
      Act as a weather controller for a particle simulation. 
      Analyze the user's description and generate a new configuration object.
      
      Constraints:
      - particleCount: 50 to 1500
      - minSize: 0.5 to 3
      - maxSize: 2 to 12
      - fallSpeed: 0.2 to 20
      - windSpeed: -15 to 15
      - opacity: 0.1 to 1.0
      - timeOfDay: 0.0 to 24.0 (0=Midnight, 6=Sunrise, 12=Noon, 18=Sunset)
      - color: Hex string for particle color (Usually #FFF, but can be #FDA4AF for sunset snow, etc.)
      - motionStretch: 0.0 to 1.0 (Use for rain or heavy storms)
      - sparkleIntensity: 0.0 to 1.0 (Use for magical or glittering effects)
      
      If the user mentions specific times (morning, night, sunset), SET timeOfDay accordingly!
      
      Return ONLY the JSON object matching the schema.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            particleCount: { type: Type.INTEGER },
            minSize: { type: Type.NUMBER },
            maxSize: { type: Type.NUMBER },
            fallSpeed: { type: Type.NUMBER },
            windSpeed: { type: Type.NUMBER },
            opacity: { type: Type.NUMBER },
            color: { type: Type.STRING },
            timeOfDay: { type: Type.NUMBER },
            motionStretch: { type: Type.NUMBER },
            sparkleIntensity: { type: Type.NUMBER },
          },
          required: ["particleCount", "fallSpeed", "windSpeed", "color", "timeOfDay"],
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) return DEFAULT_SETTINGS;
    
    const newSettings = JSON.parse(jsonText) as SnowSettings;
    
    // Merge with defaults to ensure safety if model omits fields
    return { ...DEFAULT_SETTINGS, ...newSettings };

  } catch (error) {
    console.error("Failed to interpret weather command:", error);
    throw error;
  }
};