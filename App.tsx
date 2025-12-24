import React, { useState, useEffect } from 'react';
import { SnowCanvas } from './components/SnowCanvas';
import { ControlPanel } from './components/ControlPanel';
import { SnowSettings, DEFAULT_SETTINGS } from './types';
import { getAtmosphere } from './utils/weatherUtils';

const App: React.FC = () => {
  const [settings, setSettings] = useState<SnowSettings>(DEFAULT_SETTINGS);
  const [atmosphere, setAtmosphere] = useState(getAtmosphere(DEFAULT_SETTINGS.timeOfDay));

  // Update atmosphere whenever time changes
  useEffect(() => {
    setAtmosphere(getAtmosphere(settings.timeOfDay));
  }, [settings.timeOfDay]);

  return (
    <div 
      className="relative w-full h-screen overflow-hidden text-white selection:bg-blue-500/30 transition-all duration-1000 ease-in-out"
      style={{
        background: atmosphere.skyGradient
      }}
    >
      
      {/* Celestial Bodies Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
         {/* Stars */}
         <div 
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ 
                opacity: atmosphere.starOpacity,
                backgroundImage: 'radial-gradient(2px 2px at 20px 30px, #eee, rgba(0,0,0,0)), radial-gradient(2px 2px at 40px 70px, #fff, rgba(0,0,0,0)), radial-gradient(2px 2px at 50px 160px, #ddd, rgba(0,0,0,0)), radial-gradient(2px 2px at 90px 40px, #fff, rgba(0,0,0,0)), radial-gradient(2px 2px at 130px 80px, #fff, rgba(0,0,0,0)), radial-gradient(2px 2px at 160px 120px, #ddd, rgba(0,0,0,0))',
                backgroundSize: '200px 200px',
                backgroundRepeat: 'repeat'
            }} 
         />
         
         {/* Sun */}
         {atmosphere.sunPosition.visible && (
             <div 
                className="absolute w-24 h-24 rounded-full blur-md transition-all duration-1000 ease-out shadow-[0_0_80px_rgba(253,224,71,0.5)]"
                style={{
                    left: `${atmosphere.sunPosition.x}%`,
                    top: `${atmosphere.sunPosition.y}%`,
                    backgroundColor: atmosphere.sunColor,
                    transform: 'translate(-50%, -50%)',
                }}
             >
                <div className="absolute inset-0 bg-white/30 rounded-full blur-sm" />
             </div>
         )}

         {/* Moon */}
         {atmosphere.moonPosition.visible && (
             <div 
                className="absolute w-16 h-16 rounded-full transition-all duration-1000 ease-out shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                style={{
                    left: `${atmosphere.moonPosition.x}%`,
                    top: `${atmosphere.moonPosition.y}%`,
                    backgroundColor: atmosphere.moonColor,
                    transform: 'translate(-50%, -50%)',
                }}
             >
                 {/* Moon Craters */}
                 <div className="absolute top-3 left-4 w-3 h-3 bg-slate-300/30 rounded-full" />
                 <div className="absolute bottom-4 right-5 w-4 h-4 bg-slate-300/20 rounded-full" />
                 <div className="absolute top-8 right-3 w-2 h-2 bg-slate-300/30 rounded-full" />
             </div>
         )}
      </div>

      {/* Background Layer: Static Scenic Elements */}
      <div className="absolute inset-0 z-0 flex items-end justify-center pointer-events-none">
          {/* Simple vector mountains/trees for atmosphere */}
          <div className="w-full h-1/2 bg-gradient-to-t from-black/80 via-black/20 to-transparent absolute bottom-0 z-10"></div>
      </div>

      {/* Main Content Layer */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none select-none">
        <div className="text-center space-y-4 p-8">
            <h1 className="text-6xl md:text-8xl font-serif font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
              Let it snow！
            </h1>
            <p className="text-white/40 font-light tracking-widest uppercase text-xs md:text-sm">
              滚动缩放 • 拖拽改变风向 • 点击消除雪花
            </p>
        </div>
      </div>

      {/* Snow Simulation Layer */}
      <SnowCanvas 
        settings={settings} 
        onSettingsChange={setSettings}
      />

      {/* Controls UI (Pointer events enabled) */}
      <ControlPanel 
        settings={settings} 
        onSettingsChange={setSettings} 
      />
    </div>
  );
};

export default App;