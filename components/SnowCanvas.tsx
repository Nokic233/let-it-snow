import React, { useEffect, useRef, useState } from 'react';
import { SnowSettings } from '../types';

interface SnowCanvasProps {
  settings: SnowSettings;
  onSettingsChange: (newSettings: SnowSettings) => void;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  density: number;
  vx: number;
  vy: number;
}

export const SnowCanvas: React.FC<SnowCanvasProps> = ({ settings, onSettingsChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  
  // Refs for logic that needs to be accessible inside the loop without restarting it
  const settingsRef = useRef(settings);
  const isDraggingRef = useRef(false);
  const lastMouseXRef = useRef(0);

  // Keep settingsRef in sync
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Initialize and Maintain Particles (Smart Diffing)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width, height } = canvas.getBoundingClientRect();
    
    const currentParticles = particlesRef.current;
    const targetCount = settings.particleCount;
    
    if (currentParticles.length < targetCount) {
      // Add more
      const toAdd = targetCount - currentParticles.length;
      for (let i = 0; i < toAdd; i++) {
        currentParticles.push(createParticle(width, height, settings.minSize, settings.maxSize));
      }
    } else if (currentParticles.length > targetCount) {
      // Remove excess
      currentParticles.splice(targetCount);
    }

    // Update sizes if max/min changed drastically (optional, but nice for "Size" slider)
    // We iterate to update existing particles to the new size constraints smoothly
    currentParticles.forEach(p => {
        if (p.radius > settings.maxSize) p.radius = settings.maxSize;
        if (p.radius < settings.minSize) p.radius = settings.minSize;
    });

  }, [settings.particleCount, settings.minSize, settings.maxSize]);

  const createParticle = (w: number, h: number, min: number, max: number): Particle => ({
    x: Math.random() * w,
    y: Math.random() * h,
    radius: Math.random() * (max - min) + min,
    density: Math.random() * 200,
    vx: (Math.random() - 0.5) * 0.5,
    vy: Math.random() * 0.5 + 0.5,
  });

  // Animation Loop - Runs once and reads from refs
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Read latest settings from ref to avoid hook dependency restart
      const currentSettings = settingsRef.current;
      const { width, height } = canvas;
      
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = currentSettings.color;
      ctx.globalAlpha = currentSettings.opacity;

      const particles = particlesRef.current;
      
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Movement
        p.x += Math.sin(p.density + i) * 0.3 + currentSettings.windSpeed + p.vx;
        p.y += (Math.cos(p.density + i) * 0.1 + currentSettings.fallSpeed + p.vy);

        // Wrapping
        if (p.x > width + 20) p.x = -20;
        if (p.x < -20) p.x = width + 20;
        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []); // Empty dependency array = persistent loop

  // Window Resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Interaction Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 1. Check for "Pop" (Click on particle)
    // We iterate backward to find the one "on top" visually
    let hit = false;
    const hitThreshold = 15; // Generous hit box
    
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        const dist = Math.hypot(p.x - x, p.y - y);
        
        if (dist < Math.max(p.radius * 2, hitThreshold)) {
            // POP!
            particlesRef.current.splice(i, 1);
            // Update parent setting to reflect count change? 
            // Better to just let it visually disappear and eventually respawn if we had a strict count,
            // but here we just reduce the count in the ref. 
            // To sync with UI, we should really update the settings, 
            // but that triggers a re-render. Let's just remove it visually for fun.
            // If we want it to persist, we should update settings:
            onSettingsChange({
                ...settingsRef.current,
                particleCount: Math.max(0, settingsRef.current.particleCount - 1)
            });
            hit = true;
            break; // Only pop one at a time
        }
    }

    if (!hit) {
        // 2. Prepare for Drag (Wind)
        isDraggingRef.current = true;
        lastMouseXRef.current = e.clientX;
        canvasRef.current.setPointerCapture(e.pointerId);
        canvasRef.current.style.cursor = 'grabbing';
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
        const deltaX = e.clientX - lastMouseXRef.current;
        lastMouseXRef.current = e.clientX;

        // Adjust wind speed based on drag delta
        const sensitivity = 0.05;
        const newWind = settingsRef.current.windSpeed + (deltaX * sensitivity);
        
        // Clamp to reasonable limits
        const clampedWind = Math.max(-15, Math.min(15, newWind));
        
        // We update the parent settings. 
        // Note: This causes re-renders of React components, but our Canvas loop is decoupled via refs
        // so it remains smooth.
        onSettingsChange({
            ...settingsRef.current,
            windSpeed: clampedWind
        });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grab';
        canvasRef.current.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="absolute top-0 left-0 w-full h-full z-10 cursor-grab active:cursor-grabbing touch-none"
    />
  );
};
