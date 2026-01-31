
import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        return;
      }

      setTimeLeft({
        d: Math.floor(difference / (1000 * 60 * 60 * 24)),
        h: Math.floor((difference / (1000 * 60 * 60)) % 24),
        m: Math.floor((difference / 1000 / 60) % 60),
        s: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return null;

  const isLate = timeLeft.d === 0 && timeLeft.h === 0 && timeLeft.m === 0 && timeLeft.s === 0;

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${isLate ? 'bg-rose-50 border-rose-100' : 'bg-slate-900 border-slate-800'} text-white shadow-inner`}>
      <div className="flex flex-col items-center min-w-[50px]">
        <span className="text-2xl font-black">{timeLeft.d}</span>
        <span className="text-[10px] uppercase font-bold opacity-50">Days</span>
      </div>
      <span className="text-xl font-bold opacity-30">:</span>
      <div className="flex flex-col items-center min-w-[50px]">
        <span className="text-2xl font-black">{timeLeft.h.toString().padStart(2, '0')}</span>
        <span className="text-[10px] uppercase font-bold opacity-50">Hrs</span>
      </div>
      <span className="text-xl font-bold opacity-30">:</span>
      <div className="flex flex-col items-center min-w-[50px]">
        <span className="text-2xl font-black">{timeLeft.m.toString().padStart(2, '0')}</span>
        <span className="text-[10px] uppercase font-bold opacity-50">Min</span>
      </div>
      <span className="text-xl font-bold opacity-30">:</span>
      <div className="flex flex-col items-center min-w-[50px]">
        <span className="text-2xl font-black text-indigo-400">{timeLeft.s.toString().padStart(2, '0')}</span>
        <span className="text-[10px] uppercase font-bold opacity-50">Sec</span>
      </div>
      <div className="ml-auto flex flex-col items-end">
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Remaining</span>
        <span className="text-[10px] opacity-60">to final deadline</span>
      </div>
    </div>
  );
};

export default CountdownTimer;
