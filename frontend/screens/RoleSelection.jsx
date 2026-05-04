import React from 'react';

export const RoleSelection = ({ onSelect, onBack }) => {
  return (
    <div className="h-full w-full flex flex-col bg-white overflow-hidden relative">
      {/* Header with Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#FF0000] shadow-sm active:scale-90 transition-all"
        >
          <span className="material-icons-round text-xl">arrow_back</span>
        </button>
      </div>
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-red-50/50 to-transparent -z-10" />

      {/* Header */}
      <div className="flex flex-col items-center pt-8 pb-6 px-6 shrink-0">
        <div className="w-14 h-14 bg-[#FF0000] rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-red-100 animate-float">
          <span className="text-white font-display text-3xl font-black">t</span>
        </div>
        <h1 className="text-2xl font-display font-black text-slate-900 tracking-tight text-center">Your Journey Starts Here</h1>
        <p className="text-slate-400 font-medium text-[13px] mt-1 text-center max-w-[240px]">Tailor your Token experience based on your current goal</p>
      </div>

      {/* Options Container */}
      <div className="flex-1 px-6 flex flex-col gap-8 overflow-y-auto no-scrollbar pb-12 pt-4">
        {/* Find a Job Card */}
        <button 
          onClick={() => onSelect('job_seeker')}
          className="group relative flex flex-col bg-white border border-slate-100 rounded-[40px] hover:border-[#FF0000] hover:shadow-2xl hover:shadow-red-50 transition-all duration-500 overflow-hidden active:scale-[0.98] shrink-0 min-h-[300px] justify-center"
        >
          {/* Decorative Background Pattern */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#FF0000] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-red-50/50 rounded-full -mr-24 -mt-24 group-hover:scale-125 transition-transform duration-700" />
          
          {/* Specific User Requested Image - Positioned Top Right */}
          <div className="absolute top-8 right-8 w-36 h-36 overflow-hidden rounded-[32px] shadow-2xl border-4 border-white group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 z-20">
            <img 
              src="https://www.ziprecruiter.com/svc/fotomat/public-ziprecruiter/cms/1127950001VirtualEventPlanner.jpg=ws1280x960" 
              alt="Find a Job" 
              className="w-full h-full object-cover" 
            />
          </div>

          <div className="relative z-10 w-full flex flex-col items-start px-10">
            <div className="w-20 h-20 bg-red-50 group-hover:bg-[#FF0000] rounded-3xl flex items-center justify-center mb-8 transition-colors duration-300 shadow-lg shadow-red-50 group-hover:shadow-red-200">
              <span className="material-icons-round text-[#FF0000] group-hover:text-white text-5xl">work_outline</span>
            </div>
            
            <h2 className="text-4xl font-display font-black text-slate-900 mb-3 tracking-tight">Find a Job</h2>
            <p className="text-slate-500 font-bold text-lg leading-relaxed max-w-[220px] text-left">
              Explore thousands of roles and get hired today.
            </p>
            
            <div className="mt-8 flex items-center text-[#FF0000] font-display font-black text-base uppercase tracking-[0.15em] group-hover:translate-x-3 transition-transform">
              <span>Get Started</span>
              <span className="material-icons-round ml-3 text-xl">arrow_forward</span>
            </div>
          </div>
        </button>

        {/* Hire Talent Card */}
        <button 
          onClick={() => onSelect('recruiter')}
          className="group relative flex flex-col bg-[#111827] border border-slate-800 rounded-[40px] hover:shadow-2xl hover:shadow-slate-900 transition-all duration-500 overflow-hidden active:scale-[0.98] shrink-0 min-h-[300px] justify-center"
        >
          {/* Decorative Pattern */}
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mb-32 group-hover:scale-125 transition-transform duration-700" />

          <div className="relative z-10 w-full flex flex-col items-start px-10">
            <div className="w-20 h-20 bg-white/10 group-hover:bg-[#FF0000] rounded-3xl flex items-center justify-center mb-8 transition-colors duration-300 shadow-2xl">
              <span className="material-icons-round text-white text-5xl">groups</span>
            </div>
            
            <h2 className="text-4xl font-display font-black text-white mb-3 tracking-tight">Hire Talent</h2>
            <p className="text-slate-400 font-bold text-lg leading-relaxed max-w-[240px] text-left">
              Post job openings and find the perfect candidate.
            </p>
            
            <div className="mt-8 flex items-center text-white font-display font-black text-base uppercase tracking-[0.15em] group-hover:text-[#FF0000] transition-colors group-hover:translate-x-3 transition-transform">
              <span>Recruiter Portal</span>
              <span className="material-icons-round ml-3 text-xl">arrow_forward</span>
            </div>
          </div>
        </button>
      </div>

      {/* Footer Branding */}
      <div className="py-6 flex flex-col items-center justify-center gap-1.5 bg-slate-50/50">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Token Premium Ecosystem</p>
        <div className="flex gap-4">
          <div className="w-1.5 h-1.5 rounded-full bg-red-200" />
          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-red-200" />
        </div>
      </div>
    </div>
  );
};


