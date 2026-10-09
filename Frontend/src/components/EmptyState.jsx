import React from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Users, Calendar, FileText } from 'lucide-react';

export default function EmptyState({
  title = 'No records found',
  description = 'There are currently no items to display.',
  icon: IconComponent = FolderOpen,
  action,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center p-12 text-center rounded-[2rem] border border-[#DED8CF]/60 bg-white/40 shadow-soft"
    >
      <div className="relative mb-4 flex items-center justify-center">
        <div className="absolute w-16 h-16 bg-[#5D7052]/10 rounded-full blur-sm" />
        <div className="relative w-14 h-14 rounded-2xl bg-[#5D7052]/10 border border-[#5D7052]/20 flex items-center justify-center text-[#5D7052]">
          <IconComponent className="w-7 h-7" strokeWidth={1.75} />
        </div>
      </div>

      <h3 className="font-fraunces text-xl font-semibold text-[#2C2C24] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[#78786C] max-w-sm leading-relaxed mb-6">
        {description}
      </p>

      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </motion.div>
  );
}
