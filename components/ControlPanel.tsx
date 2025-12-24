import React, { useState } from 'react';
import { SnowSettings } from '../types';
import { interpretWeatherCommand } from '../services/geminiService';
import { getAtmosphere } from '../utils/weatherUtils';
import { Loader2, Wind, Snowflake, Gauge, Wand2, X, Settings2, Palette, Scaling, Sparkles, MoveRight, SunMoon } from 'lucide-react';

interface ControlPanelProps {
  settings: SnowSettings;
  onSettingsChange: (newSettings: SnowSettings) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ settings, onSettingsChange }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('ai');

  const handleSliderChange = (key: keyof SnowSettings, value: number) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handleTimeChange = (hour: number) => {
    // When time changes, we also update the colors to match the atmosphere
    // This gives immediate visual feedback and keeps the simulation consistent
    const atmosphere = getAtmosphere(hour);
    onSettingsChange({
        ...settings,
        timeOfDay: hour,
        color: atmosphere.snowColor,
        // We only extract the top color from the gradient logic ideally, 
        // but for now let's just keep the state consistent so the AI knows "it's night"
        // The App component handles the actual gradient rendering.
    });
  };

  const handleAICommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      const newSettings = await interpretWeatherCommand(prompt, settings);
      
      // If the AI didn't change the time (it might default to noon), but the prompt implies time
      // we might want to be smart, but let's trust the AI output first.
      // We apply the atmosphere colors based on the AI's chosen time.
      const atmosphere = getAtmosphere(newSettings.timeOfDay);
      
      onSettingsChange({
        ...newSettings,
        color: atmosphere.snowColor // Ensure snow color matches the time
      });
      setPrompt('');
    } catch (error) {
      alert("哎呀！天气之神没听清，请重试。");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-white/10 backdrop-blur-md rounded-full shadow-lg border border-white/20 text-white hover:bg-white/20 transition-all duration-300 hover:scale-110"
      >
        <Settings2 size={24} />
      </button>
    );
  }

  const formatTime = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.floor((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm mx-auto md:mx-0">
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-white animate-in fade-in slide-in-from-bottom-10 duration-500">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <h2 className="font-serif text-lg font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">
            天气控制器
          </h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-white/50 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-1 m-2 bg-black/20 rounded-lg">
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'ai' 
                ? 'bg-blue-500/20 text-blue-200 shadow-sm' 
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <Wand2 size={14} />
            AI 魔法
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'manual' 
                ? 'bg-blue-500/20 text-blue-200 shadow-sm' 
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <Settings2 size={14} />
            手动调节
          </button>
        </div>

        <div className="p-5 space-y-6 max-h-[60vh] overflow-y-auto scrollbar-hide">
          {activeTab === 'ai' ? (
            <div className="space-y-4">
              <p className="text-sm text-blue-100/80 leading-relaxed">
                描述您想看到的天气。Gemini 将为您调整时间、物理效果和配色。
              </p>
              <form onSubmit={handleAICommand} className="relative">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder='"夕阳下的暴风雪..."'
                  disabled={isLoading}
                  className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 placeholder:text-white/20"
                />
                <button
                  type="submit"
                  disabled={isLoading || !prompt.trim()}
                  className="absolute right-2 top-2 p-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors shadow-lg shadow-blue-500/20"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                </button>
              </form>
              <div className="flex flex-wrap gap-2 pt-2">
                {["暴风雪", "日出", "午夜极光", "火星落日", "粉色糖果雨"].map(preset => (
                  <button
                    key={preset}
                    onClick={() => {
                        setPrompt(preset);
                    }}
                    className="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              
              {/* Time of Day Slider */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                  <div className="flex justify-between text-sm text-yellow-200 font-medium">
                      <span className="flex items-center gap-2"><SunMoon size={16}/> 时间</span>
                      <span className="font-mono">{formatTime(settings.timeOfDay)}</span>
                  </div>
                  <input
                      type="range"
                      min="0"
                      max="24"
                      step="0.1"
                      value={settings.timeOfDay}
                      onChange={(e) => handleTimeChange(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gradient-to-r from-slate-900 via-sky-500 to-slate-900 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,255,255,0.5)] hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
                  />
                  <div className="flex justify-between text-[10px] text-white/30 px-1">
                      <span>午夜</span>
                      <span>日出</span>
                      <span>正午</span>
                      <span>日落</span>
                      <span>午夜</span>
                  </div>
              </div>

              {/* Density */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-blue-200 font-medium">
                  <span className="flex items-center gap-1"><Snowflake size={12}/> 密度</span>
                  <span>{settings.particleCount}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1500"
                  value={settings.particleCount}
                  onChange={(e) => handleSliderChange('particleCount', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                />
              </div>

              {/* Speed & Wind Row */}
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-blue-200 font-medium">
                      <span className="flex items-center gap-1"><Gauge size={12}/> 速度</span>
                      <span>{settings.fallSpeed.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="20"
                      step="0.1"
                      value={settings.fallSpeed}
                      onChange={(e) => handleSliderChange('fallSpeed', parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-blue-200 font-medium">
                      <span className="flex items-center gap-1"><Wind size={12}/> 风力</span>
                      <span>{settings.windSpeed.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="-15"
                      max="15"
                      step="0.1"
                      value={settings.windSpeed}
                      onChange={(e) => handleSliderChange('windSpeed', parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full"
                    />
                  </div>
              </div>

              {/* Effects Section */}
              <div className="pt-2 border-t border-white/10 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-purple-200 font-medium">
                      <span className="flex items-center gap-1"><Sparkles size={12}/> 晶莹闪烁</span>
                      <span>{(settings.sparkleIntensity! * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.sparkleIntensity}
                      onChange={(e) => handleSliderChange('sparkleIntensity', parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-purple-500/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-cyan-200 font-medium">
                      <span className="flex items-center gap-1"><MoveRight size={12}/> 动态拖尾</span>
                      <span>{settings.motionStretch!.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      step="0.1"
                      value={settings.motionStretch}
                      onChange={(e) => handleSliderChange('motionStretch', parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-cyan-500/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                    />
                  </div>
              </div>

              {/* Colors (Manual Override) */}
               <div className="space-y-3 pt-2 border-t border-white/10 opacity-70 hover:opacity-100 transition-opacity">
                 <p className="text-[10px] text-white/30 uppercase tracking-widest">手动颜色覆盖</p>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-200 font-medium flex items-center gap-1"><Palette size={12}/> 颗粒</span>
                    <input 
                        type="color" 
                        value={settings.color}
                        onChange={(e) => onSettingsChange({ ...settings, color: e.target.value })}
                        className="w-8 h-8 rounded-full overflow-hidden cursor-pointer bg-transparent border-0 p-0 shadow-sm"
                    />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};