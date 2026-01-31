
import React from 'react';
import { Milestone } from '../types';

interface MilestoneCardProps {
  milestone: Milestone;
  index: number;
  isCompleted: boolean;
  onToggle: (id: string) => void;
}

const MilestoneCard: React.FC<MilestoneCardProps> = ({ milestone, index, isCompleted, onToggle }) => {
  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'High': return 'bg-red-100 text-red-700 border-red-200';
      case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Low': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatTime = (dt: string) => {
    try {
      const date = new Date(dt.replace(' ', 'T'));
      return date.toLocaleString([], { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return dt;
    }
  };

  return (
    <div className={`relative pl-8 pb-10 last:pb-0 group transition-opacity duration-300 ${isCompleted ? 'opacity-60' : 'opacity-100'}`}>
      {/* Timeline Line */}
      <div className={`absolute left-[11px] top-0 bottom-0 w-0.5 transition-colors ${isCompleted ? 'bg-indigo-300' : 'bg-slate-200'} group-last:bg-transparent`}></div>
      
      {/* Timeline Bullet */}
      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 z-10 transition-all ${isCompleted ? 'bg-indigo-500 border-indigo-200' : 'bg-white border-indigo-500'}`}>
        {isCompleted && (
          <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      
      <div className={`bg-white rounded-xl border p-5 shadow-sm transition-all ${isCompleted ? 'border-indigo-100 bg-indigo-50/30' : 'border-slate-200 shadow-sm hover:shadow-md'}`}>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            <div className="pt-1">
               <input 
                type="checkbox" 
                checked={isCompleted}
                onChange={() => onToggle(milestone.id)}
                className="checkbox-custom rounded-md border-slate-300 transition-all cursor-pointer"
               />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs">
                  {index + 1}
                </span>
                <h3 className={`text-lg font-bold transition-all ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                  {milestone.title}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight border ${getPriorityColor(milestone.priority)}`}>
                  {milestone.priority}
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 flex items-center gap-1">
                  📅 {formatTime(milestone.deadline)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <p className={`text-sm leading-relaxed mb-4 transition-all ${isCompleted ? 'text-slate-400 italic' : 'text-slate-600'}`}>
          {milestone.description}
        </p>
        
        <div className="flex items-center text-xs font-medium text-slate-400">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Effort: {milestone.estimatedHours}h
        </div>
      </div>
    </div>
  );
};

export default MilestoneCard;
