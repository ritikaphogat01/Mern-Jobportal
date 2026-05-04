import React, { useState } from 'react';
import { MOCK_CATEGORIES, UPLOAD_URL } from '../constants';
import { AppScreen } from '../types';

export const Home = ({ 
  onSelectCategory, 
  onSelectJob, 
  onSearch, 
  onDownload, 
  onNavigate,
  favorites,
  onToggleFavorite,
  hasPaidJob = false,
  hasApprovedJob = false,
  jobs = []
}) => {
  const jobsData = jobs;
  const [sortBy, setSortBy] = React.useState('relevance');
  const [activeGuidance, setActiveGuidance] = useState(null);
  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [viewAllPopular, setViewAllPopular] = useState(false);
  const [viewAllRecommended, setViewAllRecommended] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [toastNotif, setToastNotif] = useState({show: false, title: '', message: ''});
  const lastNotifCountRef = React.useRef(0);

  // Fetch notifications
  const fetchNotifications = React.useCallback(() => {
    const mobile = localStorage.getItem('candidate_mobile') || localStorage.getItem('recruiter_mobile');
    const email = localStorage.getItem('recruiter_email');
    const identifier = mobile || email;
    
    if (!identifier) return;
    
    setLoadingNotifs(true);
    fetch(`https://mern-jobportal-1-ngjd.onrender.com/api/notifications/${identifier}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setNotifications(data);
          // Show toast popup if there are MORE notifications than before (new one arrived)
          if (data.length > lastNotifCountRef.current && lastNotifCountRef.current > 0) {
            const newest = data[0]; // sorted by timestamp desc
            if (newest) {
              setToastNotif({ show: true, title: newest.title || 'New Notification', message: newest.message || '' });
              setTimeout(() => setToastNotif({show: false, title: '', message: ''}), 5000);
            }
          }
          lastNotifCountRef.current = data.length;
        }
      })
      .catch(err => console.error('Notif Fetch Error:', err))
      .finally(() => setLoadingNotifs(false));
  }, []);

  React.useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications, fetchNotifications]);

  React.useEffect(() => {
    // Initial fetch
    fetchNotifications();
    
    // Poll every 15 seconds for real-time feel
    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const dismissNotification = async (id) => {
    // Optimistic UI
    setNotifications(prev => prev.filter(n => (n._id || n.id) !== id));
    fetch(`https://mern-jobportal-1-ngjd.onrender.com/api/notifications/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  const markAllAsRead = () => {
    const mobile = localStorage.getItem('candidate_mobile');
    if (!mobile) return;
    setNotifications([]);
    fetch(`https://mern-jobportal-1-ngjd.onrender.com/api/notifications/clear/${mobile}`, { method: 'DELETE' }).catch(console.error);
  };

  // Check login status
  React.useEffect(() => {
    const name = localStorage.getItem('candidate_name');
    const id = localStorage.getItem('candidate_id');
    const recruiterEmail = localStorage.getItem('recruiter_email');
    if (name || id || recruiterEmail) {
      setIsLoggedIn(true);
    }
  }, []);

  // Fetch categories from API dynamically
  React.useEffect(() => {
    fetch('https://mern-jobportal-1-ngjd.onrender.com/api/categories')
      .then(res => {
        if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) throw new Error('API Error');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((c) => ({
            id: c._id || c.id,
            name: c.name || 'Category',
            icon: c.icon || 'work',
            jobsCount: c.jobsCount ? String(c.jobsCount) : '0+',
            imageUrl: c.imageUrl || '',
            subCategories: c.subCategories || []
          }));
          setCategories(mapped);
        }
      })
      .catch(() => {}); // keep MOCK_CATEGORIES as fallback
  }, []);

  const sortedJobs = React.useMemo(() => {
    return [...jobsData].sort((a, b) => {
      // 1. Boosted jobs always first
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;

      // 2. Sorting by Salary (High to Low)
      if (sortBy === 'salary') {
        const getV = (s) => {
          const m = (s || "").replace(/,/g, '').match(/(\d+)/);
          if (!m) return 0;
          let v = parseInt(m[0]);
          const lower = (s || "").toLowerCase();
          if (lower.includes('l')) v *= 100000;
          else if (lower.includes('k')) v *= 1000;
          else if (v < 1000) v *= 1000;
          return v;
        };
        return getV(b.salary) - getV(a.salary);
      }

      // 3. Sorting by Date (Recent first)
      if (sortBy === 'date') return (b.postedAt || "").localeCompare(a.postedAt || "");

      return 0; // Default relevance
    });
  }, [sortBy, jobsData]);

  const filteredJobs = React.useMemo(() => {
    return sortedJobs;
  }, [sortedJobs]);


  const dynamicCategories = React.useMemo(() => {
    return categories.map(cat => {
      const validNames = [cat.name.toLowerCase()];
      if (cat.id) validNames.push(cat.id.toLowerCase());
      
      if (cat.subCategories) {
        cat.subCategories.forEach((sub) => {
          if (sub.name) validNames.push(sub.name.toLowerCase());
        });
      }
      
      // Compute accurate number of live jobs
      const count = jobsData.filter(j => validNames.includes((j.category || '').toLowerCase())).length;
      
      return {
        ...cat,
        jobsCount: count > 0 ? `${count}+` : '0+'
      };
    });
  }, [categories, jobsData]);

  return (
    <div className="animate-fade-in pb-32">
      {/* Premium Header */}
      <header className="glass px-5 pt-6 pb-4 sticky top-0 z-30 border-b border-gray-100/50">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-icons-round text-white text-xl">local_fire_department</span>
            </div>
            <span className="text-xl font-display font-extrabold tracking-tight text-accent">Token</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowNotifications(true)}
              className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-accent border border-gray-100 active:scale-90 transition-all relative"
            >
              <span className="material-icons-round text-xl">notifications</span>
              {notifications.some(n => !n.read) && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-white" />
              )}
            </button>
            {!isLoggedIn && (
              <button 
                onClick={() => onNavigate(AppScreen.MENU)}
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-accent border border-gray-100 active:scale-90 transition-all"
              >
                <span className="material-icons-round text-xl text-primary">account_circle</span>
              </button>
            )}
          </div>
        </div>
        
        <div className="relative group cursor-pointer" onClick={() => onSearch(undefined, undefined)}>
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="material-icons-round text-primary text-xl">explore</span>
          </div>
          <div className="w-full h-14 pl-12 pr-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center shadow-inner-soft group-hover:border-primary/20 transition-all">
            <span className="text-[15px] font-medium text-gray-400">Search your dream career...</span>
          </div>
        </div>
      </header>
      


      {/* ────── POPULAR JOBS (FEATURED) ────── */}
      <section className="px-5 py-6">
        <div className="flex justify-between items-end mb-4 px-2">
          <div>
            <h2 className="text-xl font-display font-black text-accent tracking-tight">Popular Jobs</h2>
            <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-1">Trending Opportunities</p>
          </div>
          <button onClick={() => setViewAllPopular(!viewAllPopular)} className="text-[10px] font-black text-primary uppercase tracking-widest active:scale-95 transition-all">
            {viewAllPopular ? 'View Less' : 'View All'}
          </button>
        </div>
        
        <div className={viewAllPopular ? "flex flex-col gap-4 pb-4 px-2" : "flex overflow-x-auto no-scrollbar gap-4 pb-4 -mx-1 px-1"}>
          {jobsData.filter(j => j.isFeatured).length > 0 ? (
            jobsData.filter(j => j.isFeatured).map(job => (
              <div 
                key={job.id} 
                onClick={() => onSelectJob(job)}
                className={`${viewAllPopular ? 'w-full' : 'w-72 flex-shrink-0'} bg-white rounded-[2.5rem] border border-gray-100 shadow-card active:scale-[0.98] transition-all relative overflow-hidden group`}
              >
                {/* Blurred Banner Background */}
                {job.imageUrl ? (
                  <div className="absolute inset-0 z-0">
                    <img src={job.imageUrl?.startsWith('http') ? job.imageUrl : `${UPLOAD_URL}${job.imageUrl}`} alt="" className="w-full h-full object-cover blur-[2px] opacity-70 group-hover:opacity-80 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70" />
                  </div>
                ) : null}

                {/* Card Content */}
                <div className="relative z-10 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 ${job.imageUrl ? 'bg-white/20 backdrop-blur-sm border-white/30' : 'bg-gray-50 border-gray-100'} rounded-2xl flex items-center justify-center border group-hover:scale-110 transition-transform overflow-hidden`}>
                      {job.companyLogo ? (
                        <img src={job.companyLogo?.startsWith('http') ? job.companyLogo : `${UPLOAD_URL}${job.companyLogo}`} className="w-full h-full object-cover" />
                      ) : (
                        <span className={`material-icons-round text-2xl ${job.imageUrl ? 'text-white' : 'text-primary/40'}`}>apartment</span>
                      )}
                    </div>
                    <span className={`px-3 py-1 ${job.imageUrl ? 'bg-white/20 text-white backdrop-blur-sm' : 'bg-primary/10 text-primary'} text-[8px] font-black uppercase tracking-widest rounded-lg`}>Featured</span>
                  </div>
                  <h4 className={`text-[17px] font-display font-black leading-tight line-clamp-1 ${job.imageUrl ? 'text-white' : 'text-accent'}`}>{job.title}</h4>
                  <p className={`text-[11px] font-bold mt-1 uppercase tracking-widest ${job.imageUrl ? 'text-white/70' : 'text-gray-400'}`}>{job.company}</p>
                  <div className="mt-6 flex flex-col gap-2">
                     <div className="flex items-center gap-2">
                        <span className={`material-icons-round text-sm ${job.imageUrl ? 'text-white/80' : 'text-primary'}`}>schedule</span>
                        <span className={`text-[10px] font-bold ${job.imageUrl ? 'text-white/90' : 'text-gray-700'}`}>{job.type}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className={`material-icons-round text-sm ${job.imageUrl ? 'text-white/80' : 'text-primary'}`}>payments</span>
                        <span className={`text-[10px] font-bold ${job.imageUrl ? 'text-white/90' : 'text-gray-700'}`}>{job.salary}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className={`material-icons-round text-sm ${job.imageUrl ? 'text-white/80' : 'text-primary'}`}>location_on</span>
                        <span className={`text-[10px] font-bold ${job.imageUrl ? 'text-white/90' : 'text-gray-700'}`}>{job.location}</span>
                     </div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                     <span className="material-icons-round text-[120px]">rocket_launch</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
             <div className="w-full h-40 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center px-8">
                <span className="material-icons-round text-gray-200 text-4xl mb-2">auto_awesome</span>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">New featured jobs arriving soon!</p>
             </div>
          )}
        </div>
      </section>


      {/* ────── JOBS BY TYPE ────── */}
      <section className="px-5 mb-10">
        <div className="px-2 mb-6">
          <h2 className="text-xl font-display font-black text-accent tracking-tight">Jobs By Type</h2>
          <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-1">Employment options</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
           {[
             { name: 'Full-Time', icon: 'schedule', filter: (j) => j.type === 'Full-Time' },
             { name: 'Part-Time', icon: 'history', filter: (j) => j.type === 'Part-Time' },
             { name: 'Internship', icon: 'school', filter: (j) => j.type === 'Internship' },
             { name: 'Contract', icon: 'assignment', filter: (j) => j.type === 'Contract' },
             { name: 'Freelance', icon: 'draw', filter: (j) => j.type === 'Freelance' },
              { name: 'Remote', icon: 'home_work', filter: (j) => j.type === 'Remote' || (j.workMode || '').toLowerCase().includes('remote') || j.location.toLowerCase().includes('remote') }
           ].map(t => {
             const count = jobsData.filter(t.filter).length;
             return (
               <button 
                key={t.name}
                onClick={() => onSearch(t.name)}
                className="bg-white p-6 rounded-[2.5rem] border border-gray-100 text-center flex flex-col items-center gap-3 active:scale-95 transition-all shadow-card hover:border-primary/20 group"
               >
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <span className="material-icons-round text-2xl">{t.icon}</span>
                  </div>
                  <div>
                    <h4 className="text-[13px] font-black text-accent line-clamp-1">{t.name}</h4>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">({count} Jobs)</p>
                  </div>
               </button>
             );
           })}
        </div>
      </section>

      {/* Grid Categories */}
      <div className="px-5 mt-4 mb-10">
        <div className="flex justify-between items-center mb-4">
           <h2 className="text-[19px] font-bold text-gray-900 tracking-tight">Jobs By Category</h2>
           <button 
             onClick={() => onNavigate(AppScreen.ALL_CATEGORIES)}
             className="text-[13px] font-bold text-red-600 border border-red-600 rounded-md px-3 py-1 hover:bg-red-50 active:scale-95 transition-all"
           >
             View All
           </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {dynamicCategories.slice(0, 4).map((cat) => (
            <button 
              key={cat.id}
              onClick={() => onSelectCategory(cat)}
              className="bg-white rounded-[1rem] border border-gray-100 shadow-sm active:scale-[0.97] transition-all overflow-hidden flex flex-col text-left group"
            >
              <div className="h-28 w-full bg-gray-50 overflow-hidden relative border-b border-gray-50 flex items-center justify-center shrink-0">
                {cat.imageUrl ? (
                  <img src={cat.imageUrl?.startsWith('http') ? cat.imageUrl : `${UPLOAD_URL}${cat.imageUrl}`} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                     <span className="material-icons-round text-[4rem] opacity-30 group-hover:scale-110 transition-transform">{cat.icon || 'business'}</span>
                  </div>
                )}
              </div>
              <div className="p-3 w-full">
                <span className="text-[14px] font-medium text-gray-800 block leading-tight truncate">{cat.name.split(' / ')[0]}</span>
                <span className="text-[12px] text-gray-400 font-medium mt-1 block">{cat.jobsCount} Jobs</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <section className="px-5 mb-12">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Recommended jobs for you</h2>
          </div>
          <button onClick={() => setViewAllRecommended(!viewAllRecommended)} className="text-[13px] font-semibold text-blue-600 hover:underline">
            {viewAllRecommended ? 'View less' : 'View all'}
          </button>
        </div>
        
        {/* Optional Tabs matching image */}
        <div className="flex gap-6 border-b border-gray-100 mb-5">
           <button className="pb-3 text-[13px] font-bold text-gray-900 border-b-2 border-gray-900">All Jobs ({filteredJobs.length})</button>
           <button className="pb-3 text-[13px] font-medium text-gray-500">You might like</button>
        </div>

        <div className={viewAllRecommended ? "flex flex-col gap-4 pb-4" : "flex gap-4 overflow-x-auto no-scrollbar pb-4 px-1 -mx-1"}>
          {filteredJobs.length === 0 ? (
            <div className="w-full bg-white p-8 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
               <span className="material-icons-round text-gray-200 text-3xl mb-3">work_off</span>
               <h3 className="text-[15px] font-bold text-gray-900 mb-1">No Openings Found</h3>
               <p className="text-[12px] text-gray-500 font-medium">Check back later for more opportunities!</p>
            </div>
          ) : (
            sortedJobs.map(job => (
              <div 
                key={job.id}
                onClick={() => onSelectJob(job)}
                className={`${viewAllRecommended ? 'w-full' : 'w-[260px] min-w-[260px]'} bg-white p-4 rounded-2xl border border-gray-200 shadow-sm active:scale-[0.98] transition-all relative flex flex-col gap-3 shrink-0 cursor-pointer hover:shadow-md group`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-100 overflow-hidden shrink-0">
                    {job.companyLogo ? (
                      <img src={job.companyLogo?.startsWith('http') ? job.companyLogo : `${UPLOAD_URL}${job.companyLogo}`} alt={job.company} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-icons-round text-primary/40 text-xl">apartment</span>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">
                    {job.postedAt && job.postedAt.includes('hours') ? 'Today' : (job.postedAt || '3d ago').replace('Posted', '').trim()}
                  </span>
                </div>
                
                <div className="flex flex-col gap-0.5">
                  <h3 className="font-bold text-gray-900 text-[15px] leading-tight line-clamp-1">{job.title}</h3>
                  <div className="flex items-center gap-1 text-gray-600 mt-1">
                    <p className="text-[12px] font-medium line-clamp-1">{job.company}</p>
                    <div className="flex items-center gap-0.5 ml-1 bg-yellow-50 px-1 rounded text-yellow-600">
                      <span className="material-icons-round text-[10px]">star</span>
                      <span className="text-[10px] font-bold">{(Math.random() * (4.9 - 3.5) + 3.5).toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-gray-500 mt-1 pt-3 border-t border-gray-50">
                  <span className="material-icons-round text-[14px]">location_on</span>
                  <span className="text-[12px] font-medium line-clamp-1">{job.location}</span>
                </div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(job.id); }}
                  className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-primary transition-colors border border-gray-100 z-10"
                >
                   <span className={`material-icons-round text-[15px] ${favorites.includes(job.id) ? 'text-primary' : ''}`}>
                     {favorites.includes(job.id) ? 'favorite' : 'favorite_border'}
                   </span>
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Career Guidance / Tips Section */}
      <section className="px-5 mb-12">
         <h2 className="text-xl font-display font-bold text-accent mb-6">Career Mastery</h2>
         <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
            {[
              { id: 'resume', title: 'Resume Checklist', icon: 'assignment', color: 'bg-orange-500' },
              { id: 'interview', title: 'Interview FAQ', icon: 'forum', color: 'bg-blue-500' },
              { id: 'skills', title: 'Skill Roadmap', icon: 'map', color: 'bg-emerald-500' }
            ].map((tip) => (
              <button key={tip.id} onClick={() => setActiveGuidance(tip.id)} className="min-w-[160px] bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center text-center hover:shadow-lg hover:border-accent transition-all active:scale-95">
                 <div className={`w-12 h-12 rounded-2xl ${tip.color} text-white flex items-center justify-center mb-4`}>
                    <span className="material-icons-round">{tip.icon}</span>
                 </div>
                 <h4 className="text-xs font-black text-gray-700 leading-tight">{tip.title}</h4>
              </button>
            ))}
         </div>
      </section>

      {/* Resume Checklist Modal */}
      {activeGuidance === 'resume' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 max-h-[85vh] overflow-y-auto shadow-2xl animate-slide-up border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-display font-black text-gray-900">Resume Checklist</h2>
              <button onClick={() => setActiveGuidance(null)} className="text-gray-400 hover:text-gray-600 text-2xl"><span className="material-icons-round">close</span></button>
            </div>
            <div className="space-y-2">
              {[
                { id: 1, task: 'Contact information at top', checked: true },
                { id: 2, task: 'Professional summary (3-4 lines)', checked: true },
                { id: 3, task: 'Work experience (latest first)', checked: false },
                { id: 4, task: 'Education & certifications', checked: false },
                { id: 5, task: 'Key skills (5-8)', checked: false },
                { id: 6, task: 'Quantifiable achievements', checked: false },
                { id: 7, task: 'Projects & portfolio links', checked: false },
                { id: 8, task: 'No spelling/grammar errors', checked: false },
                { id: 9, task: 'ATS-friendly format', checked: false },
                { id: 10, task: 'Tailored to job description', checked: false }
              ].map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <input type="checkbox" defaultChecked={item.checked} className="w-5 h-5 rounded accent-primary cursor-pointer" />
                  <span className={`text-sm font-medium ${item.checked ? 'text-gray-500 line-through' : 'text-gray-700'}`}>{item.task}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setActiveGuidance(null)} className="w-full mt-6 py-3 bg-accent text-white rounded-xl font-black text-sm uppercase shadow-lg">Done</button>
          </div>
        </div>
      )}

      {/* Interview FAQ Modal */}
      {activeGuidance === 'interview' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 max-h-[85vh] overflow-y-auto shadow-2xl animate-slide-up border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-display font-black text-gray-900">Interview FAQ</h2>
              <button onClick={() => setActiveGuidance(null)} className="text-gray-400 hover:text-gray-600 text-2xl"><span className="material-icons-round">close</span></button>
            </div>
            <div className="space-y-3">
              {[
                { q: 'Tell me about yourself', a: 'Give a 2-3 minute summary of your career, skills & why you\'re a fit for this role.' },
                { q: 'Why do you want this job?', a: 'Research the company. Mention specific aspects that excite you and how your skills match.' },
                { q: 'What are your strengths?', a: 'Pick 3-4 genuine strengths backed by examples. Keep them relevant to the role.' },
                { q: 'Tell us about a failure', a: 'Use STAR method (Situation, Task, Action, Result). Show what you learned.' },
                { q: 'Where do you see yourself in 5 years?', a: 'Show ambition but alignment with the company. Mention growth within this role.' }
              ].map((faq, i) => (
                <details key={i} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <summary className="font-bold text-gray-900 cursor-pointer text-sm">{faq.q}</summary>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
            <button onClick={() => setActiveGuidance(null)} className="w-full mt-6 py-3 bg-accent text-white rounded-xl font-black text-sm uppercase shadow-lg">Close</button>
          </div>
        </div>
      )}

      {/* Skill Roadmap Modal */}
      {activeGuidance === 'skills' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 max-h-[85vh] overflow-y-auto shadow-2xl animate-slide-up border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-display font-black text-gray-900">Skill Roadmap</h2>
              <button onClick={() => setActiveGuidance(null)} className="text-gray-400 hover:text-gray-600 text-2xl"><span className="material-icons-round">close</span></button>
            </div>
            <div className="space-y-3">
              {[
                { level: 'Foundational', skills: 'HTML, CSS, JavaScript basics', timeline: 'Weeks 1-4' },
                { level: 'Intermediate', skills: 'React, API integration, Git', timeline: 'Weeks 5-12' },
                { level: 'Advanced', skills: 'State management, Testing, Deployment', timeline: 'Weeks 13-20' },
                { level: 'Expert', skills: 'System design, Performance, Full-stack', timeline: 'Weeks 21+' }
              ].map((step, i) => (
                <div key={i} className="p-3 border-l-4 border-accent bg-accent/5 rounded-r-lg">
                  <h4 className="font-black text-accent text-xs uppercase">{step.level}</h4>
                  <p className="text-xs text-gray-700 mt-1">{step.skills}</p>
                  <p className="text-[9px] text-gray-500 uppercase font-bold mt-1">{step.timeline}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setActiveGuidance(null)} className="w-full mt-6 py-3 bg-accent text-white rounded-xl font-black text-sm uppercase shadow-lg">Close</button>
          </div>
        </div>
      )}

      {/* ────── NOTIFICATION SIDEBAR (DRAWER) ────── */}
      {showNotifications && (
        <div className="absolute inset-0 z-[100] flex items-end justify-end pointer-events-none overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto animate-fade-in"
            onClick={() => setShowNotifications(false)}
          />
          
          {/* Drawer Panel */}
          <div className="relative w-full max-w-[280px] h-full bg-white shadow-2xl pointer-events-auto animate-slide-left flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex-1">
                <h2 className="text-xl font-display font-black text-accent tracking-tight">Notifications</h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Updates for you</p>
                  <button onClick={fetchNotifications} className={`w-4 h-4 rounded-full flex items-center justify-center bg-gray-50 text-gray-400 active:rotate-180 transition-all ${loadingNotifs ? 'animate-spin' : ''}`}>
                    <span className="material-icons-round text-[10px]">refresh</span>
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setShowNotifications(false)}
                className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-accent transition-colors"
              >
                <span className="material-icons-round text-lg">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingNotifs && notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40">
                  <span className="material-icons-round animate-spin text-primary opacity-20 text-4xl">autorenew</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-4">
                    <span className="material-icons-round text-gray-200 text-3xl">notifications_off</span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">No new updates</h3>
                  <p className="text-[11px] text-gray-300 mt-2">We'll notify you when your application status changes</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif._id || notif.id}
                    className="p-5 bg-white border border-gray-100 rounded-[1.8rem] relative group animate-fade-in shadow-sm hover:shadow-md transition-all"
                  >
                    <button 
                      onClick={() => dismissNotification(notif._id || notif.id)}
                      className="absolute top-3 right-3 w-7 h-7 bg-white rounded-full border border-gray-100 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <span className="material-icons-round text-[14px]">close</span>
                    </button>
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                        notif.title?.toLowerCase().includes('shortlist') ? 'bg-emerald-50 text-emerald-600' : 
                        notif.title?.toLowerCase().includes('reject') ? 'bg-red-50 text-red-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        <span className="material-icons-round text-xl">
                          {notif.title?.toLowerCase().includes('shortlist') ? 'verified' : 
                           notif.title?.toLowerCase().includes('reject') ? 'cancel' :
                           'notifications_active'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-[13px] font-black text-accent truncate leading-tight pr-4">{notif.title}</h4>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3">{notif.message}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Just Now
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-5 border-t border-gray-100 bg-gray-50/50">
                <button 
                  onClick={() => { markAllAsRead(); setShowNotifications(false); }}
                  className="w-full py-4 bg-primary text-white font-display font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                >
                  Mark all as read
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TOAST NOTIFICATION POPUP (like phone notification) ── */}
      {toastNotif.show && (
        <div 
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-md animate-slide-down"
          onClick={() => { setToastNotif({show: false, title: '', message: ''}); setShowNotifications(true); }}
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-5 shadow-2xl border border-gray-100 flex items-start gap-4 cursor-pointer active:scale-[0.98] transition-all">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="material-icons-round text-primary text-2xl">notifications_active</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[9px] font-black text-primary uppercase tracking-widest">Token • just now</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); setToastNotif({show: false, title: '', message: ''}); }}
                  className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
                >
                  <span className="material-icons-round text-xs">close</span>
                </button>
              </div>
              <h4 className="text-[14px] font-bold text-accent leading-tight line-clamp-1">{toastNotif.title}</h4>
              <p className="text-[12px] text-gray-500 line-clamp-2 mt-0.5 leading-snug">{toastNotif.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



