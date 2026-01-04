import React from 'react';
import { Snapshot, Customer, CustomerType } from '../types';
import { User, UserCheck, Briefcase } from 'lucide-react';

interface Props {
  snapshot: Snapshot;
  highTellerCount: number;
  lowTellerCount: number;
}

const CustomerIcon: React.FC<{ customer: Customer; currentTime: number; isServing?: boolean }> = ({ customer, currentTime, isServing }) => {
  // Logic to determine color based on CURRENT wait time, not total final wait time
  let bgColor = 'bg-emerald-500';
  
  // If serving, stick to green (happy to be served)
  if (isServing) {
     bgColor = 'bg-blue-500';
  } else {
     // In queue calculation
     const currentWait = currentTime - customer.arrivalTime;
     if (currentWait > 15) {
       bgColor = 'bg-red-500 animate-pulse'; // Angry
     } else if (currentWait > 5) {
       bgColor = 'bg-yellow-500'; // Impatient
     }
  }

  // Distinction for Reserved
  const ring = customer.type === CustomerType.RESERVED ? 'ring-4 ring-purple-400' : 'ring-1 ring-white';
  
  return (
    <div className={`relative group w-8 h-8 rounded-full ${bgColor} ${ring} flex items-center justify-center text-white shadow-sm mx-0.5 my-1 transition-all duration-300`}>
      <span className="text-[10px] font-bold">{customer.id}</span>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-32 p-2 bg-gray-800 text-white text-xs rounded shadow-lg pointer-events-none">
        <p className="font-bold">{customer.type}</p>
        <p>Arrived: {Math.floor(customer.arrivalTime/60)}:{Math.floor(customer.arrivalTime%60).toString().padStart(2,'0')}</p>
        {!isServing && <p>Waiting: {(currentTime - customer.arrivalTime).toFixed(1)}m</p>}
      </div>
    </div>
  );
};

const TellerStation: React.FC<{ 
  id: number; 
  type: 'High' | 'Low'; 
  customer: Customer | null;
  currentTime: number;
}> = ({ id, type, customer, currentTime }) => {
  return (
    <div className="flex flex-col items-center mx-2">
      <div className={`w-16 h-16 rounded-lg border-2 flex flex-col items-center justify-center relative ${
        customer ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="absolute -top-3 px-2 bg-white text-[10px] text-gray-500 font-bold border rounded-full">
          {type} {id + 1}
        </div>
        {customer ? (
          <div className="animate-pulse">
            <CustomerIcon customer={customer} currentTime={currentTime} isServing={true} />
          </div>
        ) : (
          <UserCheck className="w-6 h-6 text-gray-300" />
        )}
      </div>
      {customer && (
        <div className="mt-1 h-1 w-16 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 w-full animate-pulse opacity-50"></div>
        </div>
      )}
    </div>
  );
};

export const Visualizer: React.FC<Props> = ({ snapshot, highTellerCount, lowTellerCount }) => {
  return (
    <div className="flex-1 bg-slate-50 relative overflow-hidden flex flex-col">
      {/* Floor Plan */}
      <div className="flex-1 p-8 overflow-auto flex flex-col gap-12">
        
        {/* High Counter Section */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative">
          <div className="absolute top-0 left-0 bg-blue-600 text-white text-xs px-3 py-1 rounded-br-lg rounded-tl-lg font-bold uppercase tracking-wider">
            High Counters (Short Tasks)
          </div>
          
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {/* Tellers */}
            {Array.from({ length: highTellerCount }).map((_, i) => (
              <TellerStation 
                key={`h-teller-${i}`} 
                id={i} 
                type="High" 
                customer={snapshot.customersAtTellerHigh[i] || null} 
                currentTime={snapshot.time}
              />
            ))}
          </div>

          {/* Queue */}
          <div className="mt-8 min-h-[60px] bg-slate-100 rounded-lg p-3 flex flex-wrap items-center relative border border-dashed border-slate-300">
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 bg-white p-1 rounded-full border shadow-sm z-10">
               <span className="text-xs font-bold text-slate-400">IN</span>
            </div>
            {snapshot.customersInQueueHigh.length === 0 && (
               <span className="text-sm text-slate-400 mx-auto">Queue Empty</span>
            )}
            {snapshot.customersInQueueHigh.map(c => (
              <CustomerIcon key={c.id} customer={c} currentTime={snapshot.time} />
            ))}
          </div>
        </div>

        {/* Low Counter Section */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative">
          <div className="absolute top-0 left-0 bg-indigo-600 text-white text-xs px-3 py-1 rounded-br-lg rounded-tl-lg font-bold uppercase tracking-wider">
            Low Counters (Long Tasks)
          </div>
          
          <div className="mt-6 flex flex-wrap justify-center gap-4">
             {Array.from({ length: lowTellerCount }).map((_, i) => (
              <TellerStation 
                key={`l-teller-${i}`} 
                id={i} 
                type="Low" 
                customer={snapshot.customersAtTellerLow[i] || null} 
                currentTime={snapshot.time}
              />
            ))}
          </div>

          {/* Queue */}
          <div className="mt-8 min-h-[60px] bg-slate-100 rounded-lg p-3 flex flex-wrap items-center relative border border-dashed border-slate-300">
             <div className="absolute -left-3 top-1/2 -translate-y-1/2 bg-white p-1 rounded-full border shadow-sm z-10">
               <span className="text-xs font-bold text-slate-400">IN</span>
            </div>
            {snapshot.customersInQueueLow.length === 0 && (
               <span className="text-sm text-slate-400 mx-auto">Queue Empty</span>
            )}
            {snapshot.customersInQueueLow.map(c => (
              <CustomerIcon key={c.id} customer={c} currentTime={snapshot.time} />
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white border-t border-gray-200 p-3 flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="text-gray-600">Happy (&lt;5m)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-gray-600">Impatient (5-15m)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
          <span className="text-gray-600">Angry (&gt;15m)</span>
        </div>
        <div className="flex items-center gap-2 ml-4 pl-4 border-l">
          <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-purple-400"></div>
          <span className="text-gray-600">Reserved Customer</span>
        </div>
      </div>
    </div>
  );
};