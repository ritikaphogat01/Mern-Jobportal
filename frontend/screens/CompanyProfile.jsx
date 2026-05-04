
import React from 'react';
import { MOCK_JOBS } from '../constants';

export const CompanyProfile = ({ onBack, onNavigate }) => {
  const companyInfo = {
    name: 'TechNova Solutions',
    location: 'Dubai, UAE',
    employees: '50-200',
    industry: 'IT / Software',
    bio: 'TechNova is a leading software solutions provider in the Middle East, specializing in AI and cloud infrastructure.',
    logo: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&q=80&w=200'
  };

  const companyJobs = MOCK_JOBS.slice(0, 2); // Mocking jobs posted by this company

  return (
    <div className="animate-fade-in bg-background min-h-full pb-32">
      <header className="glass px-6 py-6 border-b border-gray-100 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={onBack} className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-accent bg-white shadow-sm">
          <span className="material-icons-round">arrow_back</span>
        </button>
        <h2 className="text-xl font-display font-black text-accent">Company Profile</h2>
      </header>

      <div className="p-6 space-y-8">
        {/* Company Identity */}
        <div className="flex flex-col items-center text-center">
          <img src={companyInfo.logo} className="w-24 h-24 rounded-[2rem] object-cover border-4 border-white shadow-xl mb-4" alt="Logo" />
          <h3 className="text-2xl font-display font-black text-accent">{companyInfo.name}</h3>
          <div className="flex items-center gap-2 text-primary font-bold text-sm mt-1">
            <span className="material-icons-round text-sm">location_on</span>
            {companyInfo.location}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Jobs', val: '12', icon: 'work', color: 'text-blue-500' },
            { label: 'Views', val: '1.2k', icon: 'visibility', color: 'text-emerald-500' },
            { label: 'Applied', val: '84', icon: 'people', color: 'text-primary' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
              <span className={`material-icons-round ${stat.color} text-xl mb-1`}>{stat.icon}</span>
              <h4 className="text-lg font-display font-black text-accent">{stat.val}</h4>
              <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* About Section */}
        <section>
          <h3 className="text-sm font-black text-accent uppercase tracking-widest mb-4">About Company</h3>
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-600 leading-relaxed font-medium">
              {companyInfo.bio}
            </p>
            <div className="mt-6 pt-6 border-t border-gray-50 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest mb-1">Industry</p>
                <p className="text-xs font-bold text-accent">{companyInfo.industry}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest mb-1">Employees</p>
                <p className="text-xs font-bold text-accent">{companyInfo.employees}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Posted Jobs */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black text-accent uppercase tracking-widest">Active Vacancies</h3>
            <button onClick={() => onNavigate('POST_JOB')} className="text-[10px] font-black text-primary uppercase">+ Post New</button>
          </div>
          <div className="space-y-4">
            {companyJobs.map(job => (
              <div key={job.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-card flex items-center justify-between group">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-accent truncate group-hover:text-primary transition-colors">{job.title}</h4>
                  <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest mt-1">{job.salary} • {job.type}</p>
                </div>
                <button className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-accent hover:bg-primary-soft hover:text-primary transition-all">
                  <span className="material-icons-round text-lg">edit</span>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Applicant Statistics */}
        <section>
          <h3 className="text-sm font-black text-accent uppercase tracking-widest mb-4">Applicant Quality</h3>
          <div className="bg-accent rounded-[2.5rem] p-8 text-white shadow-premium relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div>
                <div className="flex justify-between text-[10px] font-black uppercase text-white/90 mb-2">
                  <span>High Match Score (&gt;80%)</span>
                  <span>45%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[45%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-black uppercase text-white/40 mb-2">
                  <span>Relevant Experience</span>
                  <span>72%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 w-[72%]"></div>
                </div>
              </div>
            </div>
            <span className="material-icons-round absolute -right-4 -bottom-4 text-white/5 text-[100px]">analytics</span>
          </div>
        </section>
      </div>
    </div>
  );
};


