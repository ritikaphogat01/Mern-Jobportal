import React from 'react';

export const SplashScreen = () => {
  return (
    <div className="absolute inset-0 w-full h-full bg-[#FF0000] flex flex-col items-center justify-center z-[50] overflow-hidden">
      {/* Decorative pulse circles */}
      <div className="absolute w-96 h-96 bg-white/5 rounded-full animate-pulse" />
      <div className="absolute w-[30rem] h-[30rem] bg-white/5 rounded-full animate-pulse delay-700" />
      
      <div className="relative flex flex-col items-center">
        <h1 className="text-white font-display text-[5.5rem] font-black tracking-[-0.05em] leading-none animate-slide-up drop-shadow-2xl">
          token
        </h1>
        
        <div className="mt-4 flex items-center gap-1.5 overflow-hidden">
          <div className="h-0.5 w-12 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white animate-[slideLeft_1.5s_infinite]" />
          </div>
        </div>
      </div>

      {/* Footer subtle text */}
      <div className="absolute bottom-12 flex flex-col items-center">
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-white opacity-40 animate-bounce" />
          <div className="w-1.5 h-1.5 rounded-full bg-white opacity-70 animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-white opacity-40 animate-bounce [animation-delay:-0.3s]" />
        </div>
      </div>
    </div>
  );
};
