import React from 'react';
import { SimulationConfig } from '../types';
import { Settings, Play, RefreshCw, BarChart2 } from 'lucide-react';

interface Props {
  config: SimulationConfig;
  setConfig: React.Dispatch<React.SetStateAction<SimulationConfig>>;
  onRun: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  playbackSpeed: number;
  setPlaybackSpeed: (s: number) => void;
}

const ControlGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6 border-b border-gray-100 pb-4">
    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{title}</h3>
    <div className="space-y-3">
      {children}
    </div>
  </div>
);

const NumberInput: React.FC<{ label: string; value: number; onChange: (val: number) => void; min?: number; max?: number; step?: number }> = ({ label, value, onChange, min = 0, max = 1000, step = 1 }) => (
  <div className="flex justify-between items-center">
    <label className="text-sm text-gray-700">{label}</label>
    <input
      type="number"
      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      min={min}
      max={max}
      step={step}
    />
  </div>
);

const RangeInput: React.FC<{ label: string; value: number; onChange: (val: number) => void; min: number; max: number; unit?: string }> = ({ label, value, onChange, min, max, unit }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-sm">
      <span className="text-gray-700">{label}</span>
      <span className="text-gray-500 font-mono">{value}{unit}</span>
    </div>
    <input
      type="range"
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      min={min}
      max={max}
    />
  </div>
);

export const SimulationControl: React.FC<Props> = ({
  config,
  setConfig,
  onRun,
  isPlaying,
  onTogglePlay,
  onReset,
  playbackSpeed,
  setPlaybackSpeed
}) => {
  
  const updateConfig = (key: keyof SimulationConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateNestedConfig = (parent: 'highCounter' | 'lowCounter', key: string, value: number) => {
    setConfig(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [key]: value
      }
    }));
  };

  return (
    <div className="h-full overflow-y-auto p-4 bg-white border-r border-gray-200 shadow-sm custom-scrollbar">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-800">Configuration</h2>
      </div>

      <div className="flex space-x-2 mb-6">
        <button
          onClick={onRun}
          className={`flex-1 py-2 px-4 rounded-md text-white font-medium shadow-sm transition-colors ${
            isPlaying ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isPlaying ? 'Restart' : 'Simulate'}
        </button>
         <button
          onClick={onTogglePlay}
          className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
          title={isPlaying ? "Pause" : "Play"}
        >
          <Play className={`w-5 h-5 ${isPlaying ? 'fill-current' : ''}`} />
        </button>
        <button
          onClick={onReset}
          className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
          title="Reset"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <ControlGroup title="General">
        <NumberInput 
          label="Arrival Rate (cust/hr)" 
          value={config.arrivalRatePerHour} 
          onChange={(v) => updateConfig('arrivalRatePerHour', v)}
          max={500}
        />
        <RangeInput 
          label="% Reserved Customers" 
          value={config.percentReserved} 
          min={0} max={100} unit="%"
          onChange={(v) => updateConfig('percentReserved', v)}
        />
        <RangeInput 
          label="% High Counter Tasks" 
          value={config.percentHighCounterTasks} 
          min={0} max={100} unit="%"
          onChange={(v) => updateConfig('percentHighCounterTasks', v)}
        />
         <NumberInput 
          label="Duration (min)" 
          value={config.durationMinutes} 
          onChange={(v) => updateConfig('durationMinutes', v)}
          max={1440}
        />
      </ControlGroup>

      <ControlGroup title="High Counter (Short)">
        <NumberInput 
          label="Tellers Count" 
          value={config.highCounter.count} 
          onChange={(v) => updateNestedConfig('highCounter', 'count', v)}
          max={10}
        />
        <div className="text-xs font-semibold text-gray-400 mt-2 mb-1">Service Time (min)</div>
        <div className="grid grid-cols-3 gap-2">
           <div className="flex flex-col">
             <label className="text-[10px] text-gray-500">Min</label>
             <input type="number" className="w-full text-xs border rounded px-1" value={config.highCounter.serviceMin} onChange={e => updateNestedConfig('highCounter', 'serviceMin', +e.target.value)} />
           </div>
           <div className="flex flex-col">
             <label className="text-[10px] text-gray-500">Mode</label>
             <input type="number" className="w-full text-xs border rounded px-1" value={config.highCounter.serviceMode} onChange={e => updateNestedConfig('highCounter', 'serviceMode', +e.target.value)} />
           </div>
           <div className="flex flex-col">
             <label className="text-[10px] text-gray-500">Max</label>
             <input type="number" className="w-full text-xs border rounded px-1" value={config.highCounter.serviceMax} onChange={e => updateNestedConfig('highCounter', 'serviceMax', +e.target.value)} />
           </div>
        </div>
      </ControlGroup>

      <ControlGroup title="Low Counter (Long)">
        <NumberInput 
          label="Tellers Count" 
          value={config.lowCounter.count} 
          onChange={(v) => updateNestedConfig('lowCounter', 'count', v)}
          max={10}
        />
        <div className="text-xs font-semibold text-gray-400 mt-2 mb-1">Service Time (min)</div>
        <div className="grid grid-cols-3 gap-2">
           <div className="flex flex-col">
             <label className="text-[10px] text-gray-500">Min</label>
             <input type="number" className="w-full text-xs border rounded px-1" value={config.lowCounter.serviceMin} onChange={e => updateNestedConfig('lowCounter', 'serviceMin', +e.target.value)} />
           </div>
           <div className="flex flex-col">
             <label className="text-[10px] text-gray-500">Mode</label>
             <input type="number" className="w-full text-xs border rounded px-1" value={config.lowCounter.serviceMode} onChange={e => updateNestedConfig('lowCounter', 'serviceMode', +e.target.value)} />
           </div>
           <div className="flex flex-col">
             <label className="text-[10px] text-gray-500">Max</label>
             <input type="number" className="w-full text-xs border rounded px-1" value={config.lowCounter.serviceMax} onChange={e => updateNestedConfig('lowCounter', 'serviceMax', +e.target.value)} />
           </div>
        </div>
      </ControlGroup>
      
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-500 mb-2">Playback Speed</h3>
        <input
          type="range"
          min="1"
          max="100"
          value={playbackSpeed}
          onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1x</span>
          <span>{playbackSpeed}x</span>
          <span>100x</span>
        </div>
      </div>
    </div>
  );
};
