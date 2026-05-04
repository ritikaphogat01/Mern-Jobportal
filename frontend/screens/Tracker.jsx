import React, { useState, useEffect } from 'react';

export const Tracker = ({ onBack }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ applied: 0, interview: 0 });

  useEffect(() => {
    const userName = (localStorage.getItem('candidate_name') || '').trim().toLowerCase();
    const userMobile = (localStorage.getItem('candidate_mobile') || '').trim();
    const userEmail = userMobile ? `${userMobile}@example.com`.toLowerCase() : '';

    const fetchData = async () => {
      try {
        const [appsRes, jobsRes] = await Promise.all([
          fetch(API_URL + '/api/applications'),
          fetch(API_URL + '/api/admin/jobs') // Fetch all jobs to ensure we have company names/titles for everything
        ]);

        const appsData = await appsRes.json();
        const jobsData = await jobsRes.json();

        if (Array.isArray(appsData)) {
          // Track by Mobile Number (Locked to Login) - Primary Filter
          // Also fallback to Name/Email for older test data
          const myApps = appsData.filter((app) => {
            const appMobile = (app.applicantMobile || '').trim();
            const appName = (app.applicantName || '').trim().toLowerCase();
            const appEmail = (app.applicantEmail || '').trim().toLowerCase();
            
            const mobileMatch = userMobile && appMobile === userMobile;
            const nameMatch = userName && (appName === userName || appName.includes(userName));
            const emailMatch = userEmail && (appEmail === userEmail || appEmail.includes(userEmail));
            
            return mobileMatch || nameMatch || emailMatch;
          });

          // Map job details with fallback for unknown jobs
          const mapped = myApps.map((app) => {
            const jobId = app.jobId;
            const job = jobsData.find((j) => (j._id === jobId || j.id === jobId));
            
            let color = 'bg-blue-500';
            let statusText = app.status || 'Applied';

            if (statusText === 'Shortlisted') color = 'bg-emerald-500';
            else if (statusText === 'Interview') color = 'bg-orange-500';
            else if (statusText === 'Rejected') color = 'bg-red-500';
            else if (statusText === 'Offered') color = 'bg-purple-600';

            return {
              id: app._id || app.id,
              title: job?.title || app.jobTitle || 'Job Application',
              company: job?.company || app.company || 'Token Partner',
              status: statusText,
              date: new Date(app.appliedAt || app.appliedDate || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
              color
            };
          });

          // Sort by date (newest first)
          const sorted = [...mapped].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          setApplications(sorted);
          setStats({
            applied: mapped.length,
            interview: mapped.filter(a => ['Interview', 'Offered', 'Shortlisted'].includes(a.status)).length
          });
        }
      } catch (err) {
        console.error('Tracker sync error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 5 seconds to catch live recruiter updates
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="animate-fade-in bg-[#FAFBFF] min-h-screen pb-32">
      <header className="px-6 py-6 border-b border-gray-100 flex items-center gap-4 sticky top-0 bg-white z-10 shadow-sm">
        <button onClick={onBack} className="w-10 h-10 rounded-[1.25rem] border border-gray-100 flex items-center justify-center text-accent active:scale-95 transition-all shadow-sm">
          <span className="material-icons-round">arrow_back</span>
        </button>
        <div>
          <h2 className="text-xl font-display font-black text-accent leading-tight">Job Status</h2>
          <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-0.5">My Applications</p>
        </div>
      </header>

      <div className="p-6 space-y-8">
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm text-center relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-16 h-16 bg-accent/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-125"></div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 relative z-10">Total Applied</p>
               <h4 className="text-3xl font-display font-black text-accent relative z-10">{stats.applied.toString().padStart(2, '0')}</h4>
            </div>
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm text-center relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-125"></div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 relative z-10">Interview</p>
               <h4 className="text-3xl font-display font-black text-primary relative z-10">{stats.interview.toString().padStart(2, '0')}</h4>
            </div>
        </div>

        <div className="space-y-4">
           <div className="flex justify-between items-center px-2">
             <h3 className="text-[11px] font-black text-accent uppercase tracking-[0.2em]">Application History</h3>
             <span className="text-[10px] font-bold text-gray-400">{applications.length} Items</span>
           </div>

           {loading ? (
             <div className="py-20 text-center">
                <span className="material-icons-round animate-spin text-primary text-4xl mb-4">refresh</span>
                <p className="text-xs font-bold text-gray-400">Syncing your status...</p>
             </div>
           ) : applications.length === 0 ? (
             <div className="bg-white p-12 rounded-[3rem] border-2 border-dashed border-gray-100 text-center">
                <span className="material-icons-round text-gray-200 text-6xl mb-4">folder_open</span>
                <p className="text-sm font-bold text-gray-400">No applications sent yet</p>
                <button onClick={onBack} className="mt-4 text-primary text-[10px] font-black uppercase tracking-widest underline underline-offset-4">Explore Jobs</button>
             </div>
           ) : (
             <div className="space-y-4">
                {applications.map(app => (
                   <div key={app.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-card flex items-center justify-between group active:scale-[0.98] transition-all">
                      <div className="flex-1 min-w-0 pr-4">
                         <h4 className="font-bold text-accent text-lg leading-tight truncate">{app.title}</h4>
                         <div className="flex items-center gap-2 mt-1">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{app.company}</p>
                           <span className="text-gray-200">•</span>
                           <p className="text-[10px] font-bold text-gray-400">{app.date}</p>
                         </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                         <span className={`px-4 py-2 rounded-xl text-[9px] font-black text-white uppercase tracking-[0.1em] shadow-lg transition-transform group-hover:scale-105 ${app.color}`}>
                            {app.status}
                         </span>
                         <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">
                           {app.status === 'Applied' && 'Screening...'}
                           {app.status === 'Shortlisted' && 'Top Candidate!'}
                           {app.status === 'Interview' && 'Interviewer Ready'}
                           {app.status === 'Offered' && 'Offer Ready!'}
                           {app.status === 'Rejected' && 'Closing File'}
                         </p>
                      </div>
                   </div>
                ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};


