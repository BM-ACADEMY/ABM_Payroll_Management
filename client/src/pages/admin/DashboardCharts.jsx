import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const DashboardCharts = ({ chartData }) => {
  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="w-full h-full relative group">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="47%"
            innerRadius={75}
            outerRadius={100}
            paddingAngle={6}
            dataKey="value"
            stroke="none"
            animationDuration={1500}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color} 
                className="hover:opacity-80 transition-all duration-300 cursor-pointer"
              />
            ))}
          </Pie>
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-black border border-white/10 p-3 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].fill }}></div>
                      <p className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">
                        {payload[0].name}
                      </p>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-[#fffe01] tabular-nums">
                        {payload[0].value}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Units</span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend 
            iconType="rect" 
            iconSize={8}
            verticalAlign="bottom" 
            align="left"
            height={40}
            formatter={(value) => <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-x-0 top-[40%] flex flex-col items-center justify-center pointer-events-none -translate-y-1/2">
         <span className="text-5xl font-bold text-white tracking-tight tabular-nums">
           {total}
         </span>
         <span className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-1 opacity-50">Pulse Log</span>
      </div>
    </div>
  );
};

export default DashboardCharts;
