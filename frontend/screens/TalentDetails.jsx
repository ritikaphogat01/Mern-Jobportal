
import React from 'react';

export const TalentDetails = ({ talent, onBack }) => {
  return (
    <div className="fixed inset-0 mx-auto w-full max-w-md bg-background-light z-50 flex flex-col animate-slide-in">
      <header className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 border-b border-gray-50">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
          <span className="material-icons-round text-gray-700">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-gray-900">Talent Profile</h1>
        <button className="p-2 rounded-full hover:bg-gray-100">
          <span className="material-icons-round text-gray-700">share</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <div className="bg-white pb-8 px-5 pt-8 rounded-b-[2rem] shadow-sm mb-4 flex flex-col items-center">
          <div className="relative mb-6">
            <img src={talent.imageUrl} alt={talent.name} className="w-32 h-32 rounded-3xl object-cover border-4 border-white shadow-xl" />
            <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center">
              <span className="material-icons-round text-white text-xs">verified</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">{talent.name}</h2>
          <p className="text-primary font-bold text-lg mb-6">{talent.role}</p>

          <div className="w-full bg-primary/5 border border-primary/10 rounded-3xl p-6 flex flex-col items-center mb-6">
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Expected Package</span>
            <span className="text-2xl font-display font-black text-primary">{talent.expectedSalary}</span>
          </div>

          <div className="flex gap-4 w-full justify-center">
            <div className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center min-w-[120px]">
              <span className="text-[9px] text-gray-700 font-black uppercase mb-1">Experience</span>
              <span className="text-sm font-bold text-gray-900">{talent.experience}</span>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center min-w-[120px]">
              <span className="text-[9px] text-gray-700 font-black uppercase mb-1">Education</span>
              <span className="text-sm font-bold text-gray-900 truncate max-w-[80px]">{talent.education.split(' ')[0]}</span>
            </div>
          </div>
        </div>

        <div className="px-5 space-y-6">
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Professional Bio</h3>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
              <p className="text-gray-600 leading-relaxed text-[15px]">{talent.bio}</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Expertise & Skills</h3>
            <div className="flex flex-wrap gap-2">
              {talent.skills.map(skill => (
                <span key={skill} className="px-4 py-2 bg-white rounded-xl border border-gray-100 text-[13px] font-bold text-gray-700 shadow-sm">
                  {skill}
                </span>
              ))}
            </div>
          </section>
        </div>
      </main>

      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4 safe-bottom z-20 flex items-center gap-4 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
        <button className="flex-1 bg-accent text-white font-bold h-14 rounded-2xl text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
          <span className="material-icons-round">chat_bubble</span>
          Chat
        </button>
        <button
          className="flex-1 bg-primary text-white font-bold h-14 rounded-2xl text-lg shadow-xl shadow-red-200 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          Hire Talent
        </button>
      </div>
    </div>
  );
};


