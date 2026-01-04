import React, { useState, useEffect, useRef } from 'react';
import { SimulationConfig, SimulationResult, Snapshot } from './types';
import { BankSimulator, getSnapshotAtTime } from './services/simulator';
import { SimulationControl } from './components/SimulationControl';
import { Visualizer } from './components/Visualizer';
import { MetricsPanel } from './components/MetricsPanel';

// Initial Configuration
const INITIAL_CONFIG: SimulationConfig = {
  durationMinutes: 480, // 8 hours
  arrivalRatePerHour: 60,
  percentReserved: 20,
  percentHighCounterTasks: 60,
  highCounter: {
    count: 3,
    serviceMin: 2,
    serviceMode: 4,
    serviceMax: 8,
  },
  lowCounter: {
    count: 2,
    serviceMin: 10,
    serviceMode: 15,
    serviceMax: 25,
  },
};

const App: React.FC = () => {
  const [config, setConfig] = useState<SimulationConfig>(INITIAL_CONFIG);
  const [result, setResult] = useState<SimulationResult | null>(null);
  
  // Playback State
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(10); // 1 real sec = 10 sim mins? No, multiplier.
  // We want smooth animation. Let's say tick every 100ms.
  // increment = (100ms / 1000ms) * playbackSpeed * BASE_RATE
  // Let BASE_RATE be 1 sim minute per real second.
  // So tick 100ms -> 0.1s * speed.
  
  const simulationRef = useRef<number>(0);

  const handleRunSimulation = () => {
    const simulator = new BankSimulator(config);
    const res = simulator.run();
    setResult(res);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setResult(null);
  };

  const togglePlay = () => {
    if (!result && !isPlaying) {
      handleRunSimulation();
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    if (isPlaying && result) {
      const tickRate = 50; // Update every 50ms
      const timeAdvance = (tickRate / 1000) * playbackSpeed * 2; // Base speed: 1 sec real = 2 min sim
      
      const interval = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + timeAdvance;
          if (next >= config.durationMinutes) {
            setIsPlaying(false);
            return config.durationMinutes;
          }
          return next;
        });
      }, tickRate);

      return () => clearInterval(interval);
    }
  }, [isPlaying, result, playbackSpeed, config.durationMinutes]);

  // Derived state for visualization
  const currentSnapshot: Snapshot = result 
    ? getSnapshotAtTime(result, currentTime) 
    : {
        time: 0,
        customersInQueueHigh: [],
        customersInQueueLow: [],
        customersAtTellerHigh: Array(config.highCounter.count).fill(null),
        customersAtTellerLow: Array(config.lowCounter.count).fill(null),
        finishedCount: 0
      };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 z-10">
        <SimulationControl 
          config={config} 
          setConfig={setConfig} 
          onRun={handleRunSimulation} 
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          onReset={handleReset}
          playbackSpeed={playbackSpeed}
          setPlaybackSpeed={setPlaybackSpeed}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Header / Top Bar */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center px-8 justify-between shadow-sm">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="text-blue-600">Bank</span>Queue Sim
          </h1>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Sim Time</span>
              <span className="text-2xl font-mono text-gray-900 font-bold">
                {Math.floor(currentTime / 60).toString().padStart(2, '0')}:
                {Math.floor(currentTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
             <div className="flex flex-col items-end border-l pl-6 border-gray-200">
              <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Served</span>
              <span className="text-2xl font-mono text-emerald-600 font-bold">
                {currentSnapshot.finishedCount}
              </span>
            </div>
          </div>
        </div>

        {/* Visualization Canvas */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          <Visualizer 
            snapshot={currentSnapshot} 
            highTellerCount={config.highCounter.count}
            lowTellerCount={config.lowCounter.count}
          />
        </div>

        {/* Results / Bottom Panel (Overlay or Section) */}
        {result && (
          <div className="h-80 bg-gray-50 border-t border-gray-200 overflow-y-auto p-6 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <div className="max-w-6xl mx-auto">
               <div className="flex items-center gap-2 mb-4">
                 <h2 className="text-lg font-bold text-gray-700">Analytics</h2>
                 {currentTime < config.durationMinutes && (
                   <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full animate-pulse">
                     Simulating...
                   </span>
                 )}
               </div>
               <MetricsPanel result={result} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
