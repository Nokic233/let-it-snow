export interface Atmosphere {
  skyGradient: string;
  snowColor: string;
  sunPosition: { x: number; y: number; visible: boolean };
  moonPosition: { x: number; y: number; visible: boolean };
  starOpacity: number;
  sunColor: string;
  moonColor: string;
}

// Helper to interpolate between two hex colors
const lerpColor = (a: string, b: string, amount: number) => { 
    const ah = parseInt(a.replace(/#/g, ''), 16),
          ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
          bh = parseInt(b.replace(/#/g, ''), 16),
          br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
          rr = ar + amount * (br - ar),
          rg = ag + amount * (bg - ag),
          rb = ab + amount * (bb - ab);

    return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
}

export const getAtmosphere = (hour: number): Atmosphere => {
  // Keyframes for sky colors (Top, Bottom, Snow)
  const keyframes = [
    { time: 0, top: '#020617', bottom: '#0f172a', snow: '#6366f1' },   // Midnight
    { time: 5, top: '#1e1b4b', bottom: '#312e81', snow: '#818cf8' },   // Pre-Dawn
    { time: 6, top: '#4c1d95', bottom: '#fb7185', snow: '#fda4af' },   // Sunrise (Purple/Pink)
    { time: 8, top: '#3b82f6', bottom: '#93c5fd', snow: '#ffffff' },   // Morning
    { time: 12, top: '#0ea5e9', bottom: '#bae6fd', snow: '#ffffff' },  // Noon
    { time: 17, top: '#3b82f6', bottom: '#60a5fa', snow: '#ffffff' },  // Late Afternoon
    { time: 18.5, top: '#4c1d95', bottom: '#f97316', snow: '#fed7aa' },// Sunset (Purple/Orange)
    { time: 20, top: '#020617', bottom: '#1e1b4b', snow: '#a5b4fc' },  // Dusk
    { time: 24, top: '#020617', bottom: '#0f172a', snow: '#6366f1' },  // Midnight Wrap
  ];

  // Find current interval
  let start = keyframes[0];
  let end = keyframes[1];
  
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (hour >= keyframes[i].time && hour <= keyframes[i + 1].time) {
      start = keyframes[i];
      end = keyframes[i + 1];
      break;
    }
  }

  const range = end.time - start.time;
  const progress = (hour - start.time) / range;

  const topColor = lerpColor(start.top, end.top, progress);
  const bottomColor = lerpColor(start.bottom, end.bottom, progress);
  const snowColor = lerpColor(start.snow, end.snow, progress);

  // Celestial bodies movement (Parabola-ish)
  // Sun: active 6 to 20. Peak at 13.
  let sunVisible = false;
  let sunX = 0, sunY = 0;
  if (hour > 5 && hour < 20) {
     sunVisible = true;
     const dayProgress = (hour - 5) / (20 - 5); // 0 to 1
     sunX = dayProgress * 100; // 0% to 100% width
     sunY = 100 - (Math.sin(dayProgress * Math.PI) * 80); // Arc
  }

  // Moon: active 19 to 7. 
  let moonVisible = false;
  let moonX = 0, moonY = 0;
  // Normalize night hour for calculation (18 -> 0, 6 -> 1)
  let nightProgress = 0;
  if (hour >= 19 || hour <= 7) {
      moonVisible = true;
      if (hour >= 19) nightProgress = (hour - 19) / 12;
      else nightProgress = (hour + 5) / 12; // (24-19) + hour
      
      moonX = nightProgress * 100;
      moonY = 100 - (Math.sin(nightProgress * Math.PI) * 70);
  }

  // Stars: Visible when sun is down
  const starOpacity = sunVisible ? Math.max(0, 1 - (Math.sin(((hour - 5) / 15) * Math.PI) * 3)) : 1;

  return {
    skyGradient: `linear-gradient(to bottom, ${topColor}, ${bottomColor})`,
    snowColor,
    sunPosition: { x: sunX, y: sunY, visible: sunVisible },
    moonPosition: { x: moonX, y: moonY, visible: moonVisible },
    starOpacity,
    sunColor: hour > 17 || hour < 7 ? '#f97316' : '#fde047', // Orange at sunset/rise, Yellow at noon
    moonColor: '#f8fafc'
  };
}