import React from 'react';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function StatusBadge({ status = 'Scheduled', size = 'sm' }) {
  const isCompleted = status?.toLowerCase() === 'completed';
  const isScheduled = status?.toLowerCase() === 'scheduled';

  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-3.5 py-1.5 text-sm',
  };

  if (isCompleted) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-bold bg-[#5D7052]/15 text-[#5D7052] border border-[#5D7052]/30 shadow-sm ${
          sizeClasses[size] || sizeClasses.sm
        }`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-[#5D7052]" strokeWidth={2.2} />
        <span>Completed</span>
      </span>
    );
  }

  if (isScheduled) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-bold bg-[#C18C5D]/15 text-[#C18C5D] border border-[#C18C5D]/30 shadow-sm ${
          sizeClasses[size] || sizeClasses.sm
        }`}
      >
        <Clock className="w-3.5 h-3.5 text-[#C18C5D]" strokeWidth={2.2} />
        <span>Scheduled</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold bg-[#78786C]/15 text-[#4A4A40] border border-[#78786C]/30 shadow-sm ${
        sizeClasses[size] || sizeClasses.sm
      }`}
    >
      <AlertCircle className="w-3.5 h-3.5 text-[#78786C]" />
      <span>{status || 'Unknown'}</span>
    </span>
  );
}
