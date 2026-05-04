
import React from 'react';
import { UPLOAD_URL } from '../constants';

export const Favorites = ({ onSelectJob, onBack, favorites, onToggleFavorite, onShare, jobs }) => {
  const favoriteJobs = jobs.filter(job => favorites.includes(job.id));
  const [applicantCounts, setApplicantCounts] = React.useState({});

  // Get user skills from profile for recommendations
  const userSkills = (localStorage.getItem('candidate_skills') || '')
    .toLowerCase()
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // Smart Recommendation Logic
  const recommendedJobs = React.useMemo(() => {
    // 1. Filter out jobs already in favorites
    const otherJobs = jobs.filter(j => !favorites.includes(j.id));

    if (userSkills.length === 0) {
      return otherJobs.slice(0, 4);
    }

    // 2. Score each job based on skill matches
    const scoredJobs = otherJobs.map(job => {
      let score = 0;
      const jobTitle = job.title.toLowerCase();
      const jobCategory = job.category.toLowerCase();
      const jobDesc = (job.description || '').toLowerCase();
      const jobReqs = (job.requirements || []).map(r => r.toLowerCase());

      userSkills.forEach(skill => {
        const s = skill.toLowerCase().trim();
        if (!s) return;

        // Title Match (Strongest)
        if (jobTitle.includes(s)) score += 15;
        
        // Category Match (Strong) - handle cases like 'teaching' matching 'teacher'
        if (jobCategory.includes(s) || s.includes(jobCategory)) score += 10;
        
        // Skill/Requirements Match
        if (jobReqs.some(req => req.includes(s) || s.includes(req))) score += 5;

        // Description Match (Subtle)
        if (jobDesc.includes(s)) score += 2;
      });

      return { job, score };
    });

    // 3. Filter jobs with score > 0 and sort by highest score
    const matches = scoredJobs
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.job);

    // If matches found, return them. If not, don't show random ones yet.
    return matches.slice(0, 6);
  }, [jobs, favorites, userSkills.join(',')]);

  // If no skilled matches found, show the most recent 2 featured jobs as fallback
  const displayRecommendations = recommendedJobs.length > 0 
    ? recommendedJobs 
    : jobs.filter(j => !favorites.includes(j.id) && j.isFeatured).slice(0, 2);


  React.useEffect(() => {
    fetch('https://mern-jobportal-1-ngjd.onrender.com/api/applications')
      .then(res => res.json())
      .then(data => {
        const counts = {};
        if (Array.isArray(data)) {
          data.forEach((a) => {
            const jId = a.jobId || (a.job && a.job._id) || a.job;
            if (jId) counts[jId] = (counts[jId] || 0) + 1;
          });
        }
        setApplicantCounts(counts);
      })
      .catch(console.error);
  }, []);


  return (
    <div className="animate-fade-in pb-32 min-h-screen bg-background">
      <header className="glass px-6 pt-8 pb-5 sticky top-0 z-30 border-b border-gray-100/50">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-display font-black text-accent tracking-tight">Favorites</h1>
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mt-1">Your Career Shortlist</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="material-icons-round text-primary text-2xl">stars</span>
          </div>
        </div>
      </header>

      {/* Favorites Summary Card - NEW */}
      <div className="px-6 py-8">
         <div className="bg-accent rounded-[3rem] p-8 text-white shadow-premium relative overflow-hidden group">
            <h3 className="text-lg font-display font-bold mb-2">Shortlist Status</h3>
            <p className="text-white/90 text-[11px] font-black uppercase tracking-widest mb-6">Real-time Tracker</p>
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-white/90 text-[9px] font-black uppercase mb-1">Items</p>
                  <p className="text-2xl font-display font-bold">{favoriteJobs.length}</p>
               </div>
               <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-white/90 text-[9px] font-black uppercase mb-1">New Hits</p>
                  <p className="text-2xl font-display font-bold text-emerald-400">03</p>
               </div>
            </div>
            <span className="material-icons-round absolute -right-6 -bottom-6 text-white/5 text-[120px]">insights</span>
         </div>
      </div>

      {/* Main List */}
      <div className="px-6 space-y-6">
        <h2 className="text-lg font-display font-black text-accent mb-2">Saved Listings</h2>
        {favoriteJobs.length > 0 ? (
          favoriteJobs.map((job) => (
            <div key={job.id} onClick={() => onSelectJob(job)} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-card overflow-hidden active:scale-[0.98] transition-all group">
              <div className="p-6 flex items-start gap-5">
                <div className="w-16 h-16 rounded-[1.25rem] bg-primary-soft flex items-center justify-center shrink-0 border border-primary/5 group-hover:scale-105 transition-transform overflow-hidden">
                  {job.companyLogo ? (
                    <img src={job.companyLogo.startsWith('http') ? job.companyLogo : `${UPLOAD_URL}${job.companyLogo}`} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-icons-round text-primary text-4xl">apartment</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex w-full items-start justify-between gap-2 pr-2">
                    <h3 className="font-bold text-accent text-lg leading-tight truncate group-hover:text-primary transition-colors">{job.title}</h3>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(job.id);
                      }}
                      className="p-1 -mr-2 bg-gray-50 rounded-full flex items-center justify-center hover:bg-red-50 active:scale-90 transition-all z-10 shadow-sm border border-gray-100"
                    >
                      <span className="material-icons-round text-primary text-xl">favorite</span>
                    </button>
                  </div>
                  <p className="text-gray-700 text-[11px] font-extrabold uppercase tracking-widest mt-1">{job.company}</p>
                </div>
              </div>

              <div className="mx-6 p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest mb-1">Current Demand</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[11px] font-bold text-accent">
                      {applicantCounts[job.id] > 0
                        ? `Trending • ${applicantCounts[job.id]} Applied`
                        : 'High Potential • First to apply!'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Location</p>
                  <span className="text-[11px] font-bold text-accent">{job.location.split(',')[0]}</span>
                </div>
              </div>

              <div className="p-6 flex gap-3">
                <button className="flex-1 py-4 bg-accent text-white rounded-2xl text-[12px] font-display font-bold uppercase tracking-[0.1em] shadow-lg active:bg-primary transition-all">
                  Instant Apply
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onShare(job); }}
                  className="px-5 py-4 bg-gray-50 text-gray-700 rounded-2xl active:bg-primary-soft active:text-primary transition-all relative z-30"
                >
                  <span className="material-icons-round">share</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-200">
            <span className="material-icons-round text-8xl text-gray-100 mb-6">bookmark_outline</span>
            <p className="text-gray-700 font-bold uppercase text-xs tracking-widest">No saved jobs yet.</p>
          </div>
        )}
      </div>

      {/* Market Insights for Favorites - NEW */}
      <div className="px-6 py-10 mt-6 bg-white rounded-t-[4rem] shadow-premium">
         <h2 className="text-xl font-display font-black text-accent mb-6">Market Insights</h2>
         <div className="space-y-6">
            <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex items-center gap-5">
               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                  <span className="material-icons-round">trending_up</span>
               </div>
               <div>
                  <h4 className="text-sm font-bold text-emerald-900">High Salary Potential</h4>
                  <p className="text-[11px] text-emerald-600 font-medium">Roles in your shortlist have seen a 12% salary jump this month.</p>
               </div>
            </div>

            <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 flex items-center gap-5">
               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                  <span className="material-icons-round">bolt</span>
               </div>
               <div>
                  <h4 className="text-sm font-bold text-blue-900">Rapid Hiring Cycle</h4>
                  <p className="text-[11px] text-blue-600 font-medium">Recruiters for these roles respond within 24 hours on average.</p>
               </div>
            </div>
         </div>
      </div>

      {/* People also liked - Smart Recommendations */}
      <div className="px-6 py-10">
         <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-display font-black text-accent">You Might Also Like</h2>
         </div>
         <div className="space-y-4">
            {displayRecommendations.map(job => (
               <div key={job.id} onClick={() => onSelectJob(job)} className="p-4 bg-white rounded-3xl border border-gray-100 flex items-center gap-4 group cursor-pointer active:scale-95 transition-all shadow-sm relative">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-primary-soft overflow-hidden border border-gray-50">
                     {job.companyLogo ? (
                       <img src={job.companyLogo.startsWith('http') ? job.companyLogo : `${UPLOAD_URL}${job.companyLogo}`} alt="Logo" className="w-full h-full object-cover" />
                     ) : (
                       <span className="material-icons-round text-gray-700 group-hover:text-primary">apartment</span>
                     )}
                  </div>
                  <div className="flex-1 min-w-0">
                     <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-primary transition-colors">{job.title}</h4>
                     <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{job.company}</p>
                  </div>
                  <div className="flex items-center gap-1">
                     <span className="material-icons-round text-gray-300">chevron_right</span>
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};



