export interface SnowSettings {
  particleCount: number;
  minSize: number;
  maxSize: number;
  fallSpeed: number;
  windSpeed: number;
  opacity: number;
  color: string;
  backgroundColor: string;
  motionStretch?: number;
  sparkleIntensity?: number;
  timeOfDay: number; // 0 - 24
}

export const DEFAULT_SETTINGS: SnowSettings = {
  particleCount: 200,
  minSize: 1,
  maxSize: 4,
  fallSpeed: 1.5,
  windSpeed: 0.5,
  opacity: 0.8,
  color: '#ffffff',
  backgroundColor: '#3b82f6',
  motionStretch: 0,
  sparkleIntensity: 0,
  timeOfDay: 12, // Noon
};

export interface AIWeatherResponse {
  description: string;
  settings: SnowSettings;
}