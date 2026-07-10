import React from 'react';
import { motion } from 'framer-motion';

interface RevivalProgressBarProps {
  finalScore: number;
}

export function RevivalProgressBar({ finalScore = 0 }: RevivalProgressBarProps) {
  // Simple conditions without using confusing inline bracket operations
  let statusText = 'Revival is possible but requires significant investment and risk mitigation.';
  
  if (finalScore >= 75) {
    statusText = 'Excellent revival potential. The repository has strong fundamentals and clear market demand.';
  } else if (finalScore >= 60) {
    statusText = 'Good revival potential with moderate effort required to address key issues.';
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.15 }}
      className="p-6 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between min-h-[220px] w-full"
    >
      <div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-bold text-slate-700">Final Revival Score</span>
          <span className="text-2xl font-black text-purple-600">{finalScore}/100</span>
        </div>

        {/* The clean horizontal bar graph */}
        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
          <div 
            className="bg-purple-500 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${finalScore}%` }}
          />
        </div>
      </div>

      <p className="text-xs mt-4 text-slate-500 leading-relaxed">
        {statusText}
      </p>
    </motion.div>
  );
}
