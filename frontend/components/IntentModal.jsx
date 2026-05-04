import React from 'react';

export const IntentModal = ({ onClose, onSelect }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose}></div>
      <div className="relative bg-white w-full rounded-t-[2.5rem] p-8 shadow-2xl animate-slide-up max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-800">Find Jobs and Hire Talent</h2>
          <button onClick={onClose} className="p-1">
            <span className="material-icons-round text-gray-400">close</span>
          </button>
        </div>
        
        <div className="space-y-4">
          <button 
            onClick={() => onSelect('find')}
            className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 active:bg-gray-50 transition-colors text-left"
          >
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <span className="material-icons-round text-[#FF0000] text-2xl">work</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-base">Find Jobs</h3>
              <p className="text-xs text-gray-500">Get hired at the job you want</p>
            </div>
          </button>

          <button 
            onClick={() => onSelect('hire')}
            className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 active:bg-gray-50 transition-colors text-left"
          >
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <span className="material-icons-round text-[#FF0000] text-2xl">person</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-base">Hire Talent</h3>
              <p className="text-xs text-gray-500">Find the right person for the job</p>
            </div>
          </button>
        </div>
        <div className="h-10"></div>
      </div>
    </div>
  );
};
