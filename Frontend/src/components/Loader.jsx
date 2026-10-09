import React from 'react';
import { motion } from 'framer-motion';

export default function Loader({ message = 'Loading...', size = 'md' }) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="relative flex items-center justify-center">
        {/* Organic pulsing background blur */}
        <div className="absolute w-14 h-14 bg-[#5D7052]/20 rounded-full blur-md animate-pulse" />
        
        {/* Tactile spinning ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
          className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-[#DED8CF] border-t-[#5D7052] border-r-[#C18C5D]`}
        />
      </div>

      {message && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-sm font-medium text-[#78786C] tracking-wide"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}
