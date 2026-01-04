import React from 'react';
import { SimulationResult, ServiceType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, PieChart, Pie, Cell, Legend } from 'recharts';
import { Clock, Users, Zap, Layers, Activity, AlertCircle, Frown, Smile, Meh } from 'lucide-react';

interface Props {
  result: SimulationResult | null;
}

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode; sub?: string; colorClass?: string }> = ({ label, value, icon, sub, colorClass = "bg-blue-50 text-blue-600" }) => (
  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start space-x-4">
    <div className={`p-3 rounded-lg ${colorClass}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  </div>
);

export const MetricsPanel: React.FC<Props> = ({ result }) => {
  if (!result) return (
    <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
      Run simulation to see results
    </div>
  );

  const { metrics, customers } = result;

  // Calculate task counts
  const finishedCustomers = customers.filter(c => c.serviceEndTime !== null);
  const highCounterTasks = finishedCustomers.filter(c => c.serviceType === ServiceType.HIGH_COUNTER).length;
  const lowCounterTasks = finishedCustomers.filter(c => c.serviceType === ServiceType.LOW_COUNTER).length;

  // Prepare Chart Data
  const waitTimeByType = [
    { name: 'Walk-In', value: metrics.avgWaitTimeWalkIn },
    { name: 'Reserved', value: metrics.avgWaitTimeReserved },
  ];

  // Sentiment Pie Data
  const sentimentData = [
    { name: 'Happy (<5m)', value: metrics.sentimentStats.happy, color: '#10B981' },
    { name: 'Neutral (5-15m)', value: metrics.sentimentStats.neutral, color: '#F59E0B' },
    { name: 'Angry (>15m)', value: metrics.sentimentStats.angry, color: '#EF4444' },
  ];

  // Teller Utilization Data
  const tellerData = [
    ...metrics.tellerStats.high.map(t => ({
      name: t.label,
      utilization: +(t.utilization * 100).toFixed(1),
      idleTime: +t.idleTime.toFixed(1),
      type: 'High'
    })),
    ...metrics.tellerStats.low.map(t => ({
      name: t.label,
      utilization: +(t.utilization * 100).toFixed(1),
      idleTime: +t.idleTime.toFixed(1),
      type: 'Low'
    }))
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl mb-6">
        <h3 className="text-indigo-900 font-bold flex items-center gap-2">
           <Zap className="w-5 h-5" />
           CEO Summary: Business Impact
        </h3>
        <p className="text-indigo-700 text-sm mt-1">
          High wait times for walk-in customers are generating {metrics.sentimentStats.angry} "Angry" experiences today. 
          Implementing the Reserve App reduces average wait time by {((metrics.avgWaitTimeWalkIn - metrics.avgWaitTimeReserved) / (metrics.avgWaitTimeWalkIn || 1) * 100).toFixed(0)}% for users, directly improving Net Promoter Score (NPS).
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard 
          label="Avg Wait Time" 
          value={`${metrics.avgWaitTime.toFixed(2)}m`} 
          icon={<Clock className="w-6 h-6" />}
        />
         <StatCard 
          label="Angry Customers" 
          value={`${metrics.sentimentStats.angry}`} 
          sub="Potential Churn"
          icon={<Frown className="w-6 h-6" />}
          colorClass="bg-red-100 text-red-600"
        />
        <StatCard 
          label="Happy Customers" 
          value={`${metrics.sentimentStats.happy}`} 
          sub="Brand Advocates"
          icon={<Smile className="w-6 h-6" />}
          colorClass="bg-green-100 text-green-600"
        />
        <StatCard 
          label="Total Served" 
          value={`${metrics.throughput}`} 
          sub="Customers"
          icon={<Users className="w-6 h-6" />}
        />
         <StatCard 
          label="Reserved Benefit" 
          value={`${(metrics.avgWaitTimeWalkIn - metrics.avgWaitTimeReserved).toFixed(2)}m`}
          sub="Time Saved"
          icon={<Zap className="w-6 h-6" />}
        />
        <StatCard 
          label="Max Wait" 
          value={`${metrics.maxWaitTime.toFixed(1)}m`} 
          sub="Worst Case"
          icon={<AlertCircle className="w-6 h-6" />}
          colorClass="bg-orange-50 text-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Sentiment */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
           <h3 className="text-lg font-bold text-gray-800 mb-4">Customer Experience (Sentiment)</h3>
           <div className="flex-1 min-h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={sentimentData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {sentimentData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip />
                 <Legend verticalAlign="bottom" height={36}/>
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Wait Time by Type */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Wait Time Gap: App vs Walk-in</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waitTimeByType} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} />
                <XAxis type="number" unit="m" />
                <YAxis dataKey="name" type="category" />
                <Tooltip formatter={(val: number) => [`${val.toFixed(2)} min`, 'Avg Wait']} />
                <Bar dataKey="value" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={40}>
                   <LabelList dataKey="value" position="right" formatter={(v: number) => `${v.toFixed(1)}m`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Teller Performance */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Teller Efficiency</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Utilization Chart */}
           <div className="h-64">
              <h4 className="text-sm font-semibold text-gray-500 mb-2 text-center">Utilization Rate (%)</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tellerData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 10}} />
                  <YAxis unit="%" />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="utilization" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                     <LabelList dataKey="utilization" position="top" formatter={(v: number) => `${v}%`} fontSize={10} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
           
           {/* Idle Time Chart */}
           <div className="h-64">
              <h4 className="text-sm font-semibold text-gray-500 mb-2 text-center">Total Idle Time (min)</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tellerData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 10}} />
                  <YAxis unit="m" />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="idleTime" fill="#F59E0B" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="idleTime" position="top" formatter={(v: number) => `${v}m`} fontSize={10} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};