import React from 'react';

export default function OrganicBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {/* Top Left Moss Blob */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 bg-[#5D7052]/10 rounded-full blur-3xl opacity-70 transform -rotate-12"
      />

      {/* Top Right Terracotta Blob */}
      <div
        className="absolute top-10 -right-24 w-80 h-80 bg-[#C18C5D]/10 rounded-full blur-3xl opacity-60"
      />

      {/* Center Sand Blob */}
      <div
        className="absolute top-1/2 left-1/3 w-[32rem] h-[32rem] bg-[#E6DCCD]/25 rounded-full blur-[100px] opacity-50 pointer-events-none"
      />

      {/* Bottom Right Earth Blob */}
      <div
        className="absolute -bottom-24 right-10 w-96 h-96 bg-[#5D7052]/8 rounded-full blur-3xl opacity-60"
      />
    </div>
  );
}
