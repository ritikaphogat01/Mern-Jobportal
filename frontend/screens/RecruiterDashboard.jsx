import React, { useState } from 'react';
import { UPLOAD_URL } from '../constants';
import { AppScreen } from '../types';

export const RecruiterDashboard = ({ onBack, onPostJob, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [candidates, setCandidates] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const navRef = React.useRef(null);

  // Auto-scroll logic for navigation
  React.useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    let direction = 1;
    const interval = setInterval(() => {
      const max = nav.scrollWidth - nav.clientWidth;
      if (nav.scrollLeft >= max - 10) direction = -1;
      if (nav.scrollLeft <= 10) direction = 1;

      nav.scrollBy({ left: 100 * direction, behavior: 'smooth' });
    }, 3000);

    return () => clearInterval(interval);
  }, []);
  const [transactions, setTransactions] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: localStorage.getItem('recruiter_name') || '',
    company: localStorage.getItem('recruiter_company') || '',
    mobile: localStorage.getItem('recruiter_mobile') || '',
    location: localStorage.getItem('recruiter_location') || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [showStatusNotif, setShowStatusNotif] = useState({show: false, status: '', name: ''});
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    // Just exit to home, keeping dashboard button active as requested
    onNavigate(AppScreen.HOME);
  };

  const validCandidatesCount = candidates.filter(c => myJobs.some(j => (j._id || j.id) === c.jobId)).length;

  const handleProfileSave = async () => {
    setProfileSaving(true);
    try {
      localStorage.setItem('recruiter_name', profileForm.name);
      localStorage.setItem('recruiter_company', profileForm.company);
      localStorage.setItem('recruiter_mobile', profileForm.mobile);
      localStorage.setItem('recruiter_location', profileForm.location);
      await fetch('https://mern-jobportal-1-ngjd.onrender.com/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileForm.company, industry: 'Recruitment', email: localStorage.getItem('recruiter_email') || '', status: 'Active', location: profileForm.location })
      }).catch(() => {});
      setProfileEditMode(false);
    } catch(e) {} finally { setProfileSaving(false); }
  };

  React.useEffect(() => {
    const recruiterEmail = String(localStorage.getItem('recruiter_email') || '').trim().toLowerCase();
    
    // Fetch Applications
    fetch('https://mern-jobportal-1-ngjd.onrender.com/api/applications')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mapped = data.map((app) => ({
            id: app._id || app.id,
            name: app.applicantName || 'Unknown Applicant',
            role: 'Job Applicant',
            status: app.status || 'Applied',
            score: app.score || 85,
            email: app.applicantEmail,
            mobile: app.applicantMobile || (app.applicantEmail?.includes('@example.com') ? app.applicantEmail.split('@')[0] : (app.applicantEmail || '')),
            accountMobile: app.accountMobile,
            jobId: app.jobId,
            resumeUrl: app.resumeUrl,
            qualification: app.qualification || "N/A",
            expectedSalary: app.expectedSalary || "N/A",
            appliedAt: app.appliedAt
          }));
          setCandidates(mapped);
        }
      })
      .catch(console.error);

    // Fetch My Vacancies
    fetch('https://mern-jobportal-1-ngjd.onrender.com/api/admin/jobs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const filtered = data.filter((j) => String(j.recruiterEmail || '').trim().toLowerCase() === recruiterEmail);
          setMyJobs(filtered);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Fetch My Transactions
    fetch('https://mern-jobportal-1-ngjd.onrender.com/api/transactions')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
           const filtered = data.filter((t) => String(t.userEmail || '').trim().toLowerCase() === recruiterEmail);
           setTransactions(filtered);
        }
      });
  }, []);

  const updateStatus = async (id, newStatus, applicant) => {
    try {
      console.log('🔄 Updating Status for:', applicant.name, 'to:', newStatus);
      
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
      await fetch(`https://mern-jobportal-1-ngjd.onrender.com/api/applications/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      }).catch(err => console.warn('Status Update DB error:', err));

      const job = myJobs.find(j => (j._id || j.id) === applicant.jobId);
      
      // Use hidden accountMobile for notification, so it reaches the logged-in user
      const targetId = applicant.accountMobile || applicant.mobile || (applicant.email?.includes('@example.com') ? applicant.email.split('@')[0] : applicant.email);

      const notifData = {
        userEmail: String(targetId).trim(), // still used for DB identifier/tracker
        realEmail: applicant.email,          // used for sending actual mail
        title: `Update: ${job?.title || 'Job Application'}`,
        message: `Your status has been updated to "${newStatus}". Check My Applications for details.`,
        type: newStatus === 'Rejected' ? 'error' : 'success'
      };
      
      const res = await fetch('https://mern-jobportal-1-ngjd.onrender.com/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifData)
      });
      const data = await res.json();
      console.log('🚀 Server Response [Notif]:', data);

      setShowStatusNotif({ show: true, status: newStatus, name: applicant.name });
      setTimeout(() => setShowStatusNotif({ show: false, status: '', name: '' }), 3000);

    } catch (e) { 
        console.error('❌ Status Change Error:', e); 
        alert('Error updating status: ' + e.message);
    }
  };

  const statusOptions = ['Applied', 'Shortlisted', 'Interview', 'Offered', 'Rejected'];

  const renderOverview = () => (
    <div className="space-y-5 animate-fade-in">

      {/* 4-Stat Grid */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setActiveTab('vacancies')} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-card text-left active:scale-95 transition-all group hover:shadow-lg hover:border-blue-100">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-all">
            <span className="material-icons-round text-lg">work_outline</span>
          </div>
          <h4 className="text-2xl font-display font-black text-accent">{myJobs.filter(j => j.status === 'active').length.toString().padStart(2, '0')}</h4>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Active Jobs</p>
        </button>

        <button onClick={() => setActiveTab('applicants')} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-card text-left active:scale-95 transition-all group hover:shadow-lg hover:border-primary/20">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-all">
            <span className="material-icons-round text-lg">groups</span>
          </div>
          <h4 className="text-2xl font-display font-black text-accent">{validCandidatesCount.toString().padStart(2, '0')}</h4>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Applicants</p>
        </button>

        <button onClick={() => setActiveTab('vacancies')} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-card text-left active:scale-95 transition-all group hover:shadow-lg hover:border-amber-100">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-all">
            <span className="material-icons-round text-lg">pending_actions</span>
          </div>
          <h4 className="text-2xl font-display font-black text-accent">{myJobs.filter(j => j.status === 'pending' || j.status === 'paid').length.toString().padStart(2, '0')}</h4>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Under Review</p>
        </button>

        <button onClick={() => setActiveTab('billing')} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-card text-left active:scale-95 transition-all group hover:shadow-lg hover:border-emerald-100">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-all">
            <span className="material-icons-round text-lg">receipt_long</span>
          </div>
          <h4 className="text-2xl font-display font-black text-accent">{transactions.length.toString().padStart(2, '0')}</h4>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Invoices</p>
        </button>
      </div>

      {/* Post Job CTA */}
      <button onClick={onPostJob} className="w-full py-5 bg-primary text-white rounded-[2rem] font-display font-black text-base shadow-xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all relative overflow-hidden">
        <span className="material-icons-round text-2xl">add_circle</span>
        Post New Vacancy
        <span className="material-icons-round absolute right-5 text-white/20 text-4xl">chevron_right</span>
      </button>

      {/* Quick Actions */}
      <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-card">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-5">Quick Access</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: 'work', label: 'My Jobs', tab: 'vacancies', bg: 'bg-blue-50', color: 'text-blue-600' },
            { icon: 'groups', label: 'Candidates', tab: 'applicants', bg: 'bg-red-50', color: 'text-primary' },
            { icon: 'receipt_long', label: 'Billing', tab: 'billing', bg: 'bg-emerald-50', color: 'text-emerald-600' },
            { icon: 'manage_accounts', label: 'Profile', tab: 'profile', bg: 'bg-purple-50', color: 'text-purple-600' }
          ].map(a => (
            <button key={a.tab} onClick={() => setActiveTab(a.tab)} className="flex flex-col items-center gap-2 active:scale-90 transition-all group">
              <div className={`w-12 h-12 rounded-2xl ${a.bg} ${a.color} flex items-center justify-center shadow-sm group-hover:shadow-md transition-all`}>
                <span className="material-icons-round">{a.icon}</span>
              </div>
              <span className="text-[8px] font-black text-gray-500 uppercase tracking-wider text-center leading-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Applicants Preview */}
      {validCandidatesCount > 0 && (
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Latest Candidates</p>
            <button onClick={() => setActiveTab('applicants')} className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
              See All <span className="material-icons-round text-xs">arrow_forward</span>
            </button>
          </div>
          <div className="space-y-3">
            {candidates.filter(c => myJobs.some(j => (j._id || j.id) === c.jobId)).slice(0, 3).map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 bg-gray-50/70 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0">
                  <span className="material-icons-round">account_circle</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-accent truncate leading-tight">{c.name}</p>
                  <p className="text-[9px] font-bold text-gray-400 truncate">{c.appliedAt}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase tracking-wide shrink-0 ${
                  c.status === 'Applied' ? 'bg-blue-50 text-blue-500' :
                  c.status === 'Shortlisted' ? 'bg-primary/10 text-primary' :
                  c.status === 'Interview' ? 'bg-amber-50 text-amber-600' :
                  c.status === 'Offered' ? 'bg-emerald-50 text-emerald-600' :
                  'bg-gray-100 text-gray-500'
                }`}>{c.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pro Tip */}
      <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-purple-50 p-5 rounded-[2rem] border border-primary/10 flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
          <span className="material-icons-round">lightbulb</span>
        </div>
        <div>
          <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">💡 Pro Tip</p>
          <p className="text-[11px] font-semibold text-gray-600 leading-relaxed">Add salary range & detailed description to attract <span className="text-primary font-black">3x more</span> qualified candidates to your postings.</p>
        </div>
      </div>

    </div>
  );

  const renderBilling = () => (
    <div className="space-y-8 animate-fade-in">
        <div className="bg-accent p-8 rounded-[3rem] text-white shadow-premium relative overflow-hidden">
            <div className="relative z-10 flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">Total Spent</p>
                <h3 className="text-3xl font-display font-black text-white">₹{transactions.reduce((acc, t) => acc + (t.amount || 0), 0).toLocaleString('en-IN')}</h3>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">Total Invoices</p>
                <h4 className="text-xl font-display font-black">{transactions.length.toString().padStart(2, '0')}</h4>
              </div>
            </div>
            <span className="material-icons-round absolute -right-4 -bottom-4 text-white/5 text-[120px]">account_balance_wallet</span>
        </div>

        <div className="px-2 flex justify-between items-end">
            <div>
              <h3 className="text-sm font-black text-accent uppercase tracking-widest">Transaction History</h3>
              <p className="text-[10px] text-gray-400 font-bold mt-1">Detailed logs of your purchases</p>
            </div>
            <button onClick={() => window.print()} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 active:scale-95 transition-all">
              <span className="material-icons-round text-lg">print</span>
            </button>
        </div>

        {transactions.length === 0 ? (
          <div className="bg-white p-16 rounded-[4rem] border-2 border-dashed border-gray-100 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-icons-round text-gray-200 text-4xl">receipt_long</span>
            </div>
            <p className="text-sm font-bold text-gray-400 leading-relaxed max-w-[200px] mx-auto">You haven't made any transactions yet.</p>
          </div>
        ) : (
          <div className="space-y-5">
             {transactions.sort((a,b) => (b.date || '').localeCompare(a.date || '')).map((t, idx) => (
               <div key={t._id || t.id || idx} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-card hover:shadow-xl transition-all group">
                  <div className="flex justify-between items-start mb-6">
                     <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                           <span className="material-icons-round">verified</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-accent text-[15px] leading-tight">{t.planName}</h4>
                          <div className="flex items-center gap-2 mt-1.5">
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.date}</p>
                             <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                             <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t.time || '10:00 AM'}</p>
                          </div>
                        </div>
                     </div>
                     <div className="text-right">
                       <span className="text-xl font-display font-black text-accent">₹{t.amount}</span>
                       <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-1">SUCCESSFUL</p>
                     </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                     <div className="flex items-center gap-2">
                        <span className="material-icons-round text-xs text-gray-400">payments</span>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider">{t.method}</p>
                     </div>
                     <button className="flex items-center gap-1.5 text-[9px] font-black text-primary uppercase tracking-widest hover:underline">
                        <span className="material-icons-round text-sm">download</span> Receipt
                     </button>
                  </div>
               </div>
             ))}
          </div>
        )}
        
        <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100 text-center">
           <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2">Need GST Invoice?</p>
           <p className="text-[11px] font-bold text-blue-400 leading-tight">Please contact our support team with your Transaction ID for a corporate invoice.</p>
        </div>
    </div>
  );

  const renderApplicants = () => {
    const validCandidates = candidates.filter(c => myJobs.some(j => (j._id || j.id) === c.jobId));
    return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center px-2">
            <div><h3 className="text-sm font-black text-accent uppercase tracking-widest">Recent Applications</h3><p className="text-[10px] text-gray-400 font-bold mt-1">Review and manage candidates</p></div>
            <span className="px-3 py-1 bg-gray-100 rounded-lg text-[9px] font-black text-gray-500 uppercase">{validCandidates.length} Total</span>
        </div>
        <div className="space-y-4">
           {validCandidates.map((c) => {
             const appliedJob = myJobs.find(j => (j._id || j.id) === c.jobId);
             return (
               <div key={c.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-card flex flex-col gap-6 group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shrink-0"><span className="material-icons-round text-3xl">account_circle</span></div>
                  <div className="flex-1 min-w-0"><h4 className="font-bold text-accent text-lg leading-tight">{c.name}</h4><p className="text-[10px] font-black text-gray-700 uppercase tracking-widest mt-1">{c.role}</p><p className="text-[9px] text-gray-400 font-bold mt-0.5 truncate">{c.email}</p></div>
                  <div className="text-right"><span className="text-[11px] font-black text-primary block">{c.score}% Match</span><span className="text-[9px] font-bold text-gray-400 block mt-1">{c.appliedAt}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-4"><div className="p-4 bg-gray-50 rounded-2xl"><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Qualification</p><p className="text-[11px] font-bold text-accent">{c.qualification}</p></div><div className="p-4 bg-gray-50 rounded-2xl"><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Exp. Salary</p><p className="text-[11px] font-black text-emerald-600">₹{c.expectedSalary}</p></div></div>
                <div className="flex flex-col gap-3">
                   <div className="flex items-center gap-2"><span className="material-icons-round text-xs text-gray-400">info_outline</span><p className="text-[10px] font-bold text-gray-600 uppercase">Applied for: <span className="text-primary">{appliedJob?.title || 'Deleted Role'}</span></p></div>
                   <button onClick={() => { if (c.resumeUrl) { const link = document.createElement('a'); link.href = c.resumeUrl; link.download = `resume-${c.name.replace(/\s+/g, '-')}.pdf`; document.body.appendChild(link); link.click(); document.body.removeChild(link); } else { alert('No resume was uploaded by this applicant.'); } }} className="flex items-center justify-center gap-2 py-3 bg-gray-50 text-accent rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 hover:text-primary transition-all active:scale-95"><span className="material-icons-round text-sm">file_download</span> Download CV / Resume</button>
                </div>
                <div className="h-px bg-gray-50"></div>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {statusOptions.map(status => (<button key={status} onClick={() => updateStatus(c.id, status, c)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${c.status === status ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-50 text-gray-400 border border-gray-100 hover:border-primary/30'}`}>{status}</button>))}
                </div>
             </div>);
           })}
        </div>
    </div>
    );
  };

  const renderVacancies = () => (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center px-2">
            <div><h3 className="text-sm font-black text-accent uppercase tracking-widest">My Job Postings</h3><p className="text-[10px] text-gray-400 font-bold mt-1">Status of your vacancies</p></div>
            <span className="px-3 py-1 bg-gray-100 rounded-lg text-[9px] font-black text-gray-500 uppercase">{myJobs.length} Total</span>
        </div>
        {myJobs.length === 0 ? (
          <div className="bg-white p-12 rounded-[3rem] border-2 border-dashed border-gray-100 text-center"><span className="material-icons-round text-gray-200 text-6xl mb-4">post_add</span><p className="text-sm font-bold text-gray-400">No vacancies posted yet</p><button onClick={onPostJob} className="mt-4 text-primary text-[10px] font-black uppercase tracking-widest">Click to start hiring</button></div>
        ) : (
          <div className="space-y-4">
            {myJobs.map((job) => (
              <div key={job._id || job.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-card flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-accent/5 text-accent flex items-center justify-center shrink-0"><span className="material-icons-round text-3xl">business</span></div>
                  <div className="flex-1 min-w-0"><h4 className="font-bold text-accent text-lg leading-tight truncate">{job.title}</h4><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{job.category}</p></div>
                  <div className="text-right flex flex-col items-end gap-1.5"><span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${job.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : (job.status === 'paid' || job.status === 'pending') ? 'bg-orange-50 text-orange-600 border-orange-100' : job.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>{job.status === 'active' ? 'APPROVED' : (job.status === 'paid' || job.status === 'pending') ? 'PENDING' : job.status === 'rejected' ? 'REJECTED' : job.status?.toUpperCase() || 'PENDING'}</span>{job.isFeatured && (<div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-lg border border-primary/10 animate-pulse shadow-sm shadow-primary/5"><span className="material-icons-round text-[11px]">rocket_launch</span><span className="text-[7px] font-black uppercase tracking-widest">Boost Active</span></div>)}<p className="text-[9px] font-bold text-gray-400 mt-1">{job.postedAt}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-3"><div className="p-4 bg-gray-50 rounded-2xl"><p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter mb-1">Payment</p><p className="text-[10px] font-bold text-accent italic">{job.paymentInfo?.amount ? `Verified (₹${job.paymentInfo.amount})` : 'Awaiting Payment'}</p></div><div className="p-4 bg-gray-50 rounded-2xl text-right"><p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter mb-1">Views / Applicants</p><p className="text-[10px] font-bold text-accent">-- / {candidates.filter(c => c.jobId === (job._id || job.id)).length}</p></div></div>
                <div className="flex gap-3"><button onClick={() => setSelectedJob(job)} className="flex-1 py-4 bg-accent text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-accent/20 active:scale-95 transition-all">View Full Posting</button></div>
              </div>
            ))}
          </div>
        )}
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-8 animate-fade-in">
        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm text-center">
            <div className="w-24 h-24 bg-accent/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-accent/10 relative"><span className="material-icons-round text-accent text-4xl">business</span><div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 text-white rounded-full border-4 border-white flex items-center justify-center"><span className="material-icons-round text-sm">verified</span></div></div>
            <h3 className="text-2xl font-display font-black text-accent">{profileForm.company || 'Enterprise Partner'}</h3><p className="text-xs font-bold text-gray-500 mt-2">Verified Recruiter Account</p>
        </div>
        <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between"><h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Contact Details</h4><button onClick={() => setProfileEditMode(e => !e)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"><span className="material-icons-round text-sm">{profileEditMode ? 'close' : 'edit'}</span>{profileEditMode ? '' : 'Edit'}</button></div>
            {profileEditMode ? (
              <div className="p-6 space-y-4">
                {[{ label: 'Full Name', key: 'name', icon: 'person_outline', placeholder: 'Your Name', type: 'text' },{ label: 'Company Name', key: 'company', icon: 'business', placeholder: 'Company Name', type: 'text' },{ label: 'Mobile Number', key: 'mobile', icon: 'smartphone', placeholder: '+91 98765 43210', type: 'tel' },{ label: 'Location / City', key: 'location', icon: 'location_on', placeholder: 'City, State', type: 'text' }].map(field => (
                  <div key={field.key} className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{field.label}</label>
                    <div className="relative">
                      <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">{field.icon}</span>
                      <input 
                        type={field.type} 
                        value={profileForm[field.key]} 
                        onChange={e => {
                           let val = e.target.value;
                           if (field.key === 'mobile') {
                             val = val.replace(/\D/g, '');
                             if (val.length > 10) return;
                           }
                           setProfileForm((f) => ({ ...f, [field.key]: val }));
                        }} 
                        placeholder={field.placeholder} 
                        className="w-full h-12 pl-12 pr-4 bg-gray-50 rounded-xl font-bold text-sm text-accent focus:outline-none focus:ring-2 focus:ring-primary/20" 
                      />
                    </div>
                  </div>
                ))}
                <button onClick={handleProfileSave} disabled={profileSaving} className="w-full py-4 bg-primary text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 mt-2">{profileSaving ? <><span className="material-icons-round animate-spin text-sm">autorenew</span> Saving...</> : <><span className="material-icons-round text-sm">save</span> Save Profile</>}</button>
              </div>
            ) : (
              <div className="p-6 space-y-6">{[{ icon: 'person_outline', label: 'Personnel', value: profileForm.name || 'Guest Recruiter' },{ icon: 'alternate_email', label: 'Official Email', value: localStorage.getItem('recruiter_email') || '-' },{ icon: 'smartphone', label: 'Mobile Number', value: profileForm.mobile || 'Not set — tap Edit to add' },{ icon: 'business', label: 'Company Name', value: profileForm.company || 'Not set — tap Edit to add' }].map(row => (<div key={row.label} className="flex items-start gap-4"><span className="material-icons-round text-gray-400">{row.icon}</span><div className="flex-1"><p className="text-[9px] font-black text-gray-400 uppercase mb-1">{row.label}</p><p className="text-sm font-bold text-accent">{row.value}</p></div></div>))}</div>
            )}
        </div>
        <button 
          onClick={() => {
            // Clear only recruiter session data
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('recruiter_')) localStorage.removeItem(key);
            });
            onNavigate(AppScreen.HOME);
          }} 
          className="w-full py-4 text-primary font-black text-[10px] uppercase tracking-[0.2em] border-2 border-primary/10 rounded-2xl active:scale-95 transition-all"
        >
          Logout Recruiter Dashboard
        </button>
    </div>
  );

  return (
    <div className="animate-fade-in bg-[#FAFBFF] min-h-screen pb-32 flex flex-col">
      <header className="bg-white/80 backdrop-blur-xl px-6 py-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-accent active:scale-90 transition-all">
            <span className="material-icons-round">arrow_back</span>
          </button>
          <div>
            <h2 className="text-xl font-display font-black text-accent leading-tight">Recruiter Hub</h2>
            <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">{activeTab}</p>
          </div>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary active:scale-90 transition-all shadow-sm"
          >
            <span className="material-icons-round">person</span>
          </button>
          
          {showUserMenu && (
            <div className="absolute right-0 mt-3 w-48 bg-white rounded-3xl border border-gray-100 shadow-premium p-2 animate-fade-in z-50">
               <button 
                onClick={() => { setShowUserMenu(false); setActiveTab('profile'); }}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 rounded-2xl transition-all"
               >
                 <span className="material-icons-round text-accent text-xl">manage_accounts</span>
                 <span className="text-[11px] font-black uppercase tracking-widest text-accent">Edit Profile</span>
               </button>
               <div className="h-px bg-gray-50 my-1 mx-2"></div>
               <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-4 hover:bg-red-50 text-red-600 rounded-2xl transition-all"
               >
                 <span className="material-icons-round text-xl">home</span>
                 <span className="text-[11px] font-black uppercase tracking-widest">Exit to Home</span>
               </button>
            </div>
          )}
        </div>
      </header>
      <nav 
        ref={navRef}
        className="flex px-4 py-4 bg-white border-b border-gray-100 sticky top-[89px] z-20 overflow-x-auto no-scrollbar gap-2 scroll-smooth"
      >
        {[{ id: 'overview', label: 'Overview', icon: 'dashboard' },{ id: 'vacancies', label: 'My Vacancies', icon: 'work' },{ id: 'applicants', label: 'Applicants', icon: 'groups' },{ id: 'billing', label: 'Billing', icon: 'receipt_long' },{ id: 'profile', label: 'My Details', icon: 'business' }].map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shrink-0 ${activeTab === tab.id ? 'bg-accent text-white shadow-lg' : 'text-gray-400 bg-gray-50'}`}><span className="material-icons-round text-base">{tab.icon}</span>{tab.label}</button>))}
      </nav>
      <main className="p-6">
         {activeTab === 'overview' && renderOverview()}
         {activeTab === 'vacancies' && renderVacancies()}
         {activeTab === 'applicants' && renderApplicants()}
         {activeTab === 'billing' && renderBilling()}
         {activeTab === 'profile' && renderProfile()}
         {selectedJob && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-accent/80 backdrop-blur-md animate-fade-in overflow-y-auto"><div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl animate-slide-up relative my-auto"><div className="p-8 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-[3rem]"><div><h3 className="text-xl font-display font-black text-accent leading-tight">Review Vacancy</h3><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Posted Content Details</p></div><button onClick={() => setSelectedJob(null)} className="w-10 h-10 rounded-2xl bg-gray-50 text-gray-500 flex items-center justify-center"><span className="material-icons-round">close</span></button></div><div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar"><div className="flex items-center gap-5 pb-6 border-b border-gray-50"><div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 shrink-0">{selectedJob.companyLogo ? (<img src={selectedJob.companyLogo.startsWith('http') ? selectedJob.companyLogo : `${UPLOAD_URL}${selectedJob.companyLogo}`} className="w-full h-full object-cover rounded-2xl" alt="Logo" />) : (<span className="material-icons-round text-primary text-3xl">apartment</span>)}</div><div><h4 className="text-xl font-display font-black text-accent">{selectedJob.title}</h4><p className="text-[10px] font-black text-primary uppercase tracking-widest mt-0.5">{selectedJob.company}</p></div></div><div className="grid grid-cols-2 gap-4"><div className="p-4 bg-gray-50 rounded-2xl"><p className="text-[8px] font-black text-gray-400 uppercase mb-1">Salary Range</p><p className="text-[11px] font-bold text-accent">{selectedJob.salary || 'Competitive'}</p></div><div className="p-4 bg-gray-50 rounded-2xl text-right"><p className="text-[8px] font-black text-gray-400 uppercase mb-1">Work Mode</p><p className="text-[11px] font-bold text-accent">{selectedJob.location} ({selectedJob.workMode || 'Onsite'})</p></div></div><div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Job Description</p><p className="text-xs text-gray-600 font-medium leading-relaxed bg-gray-50/50 p-6 rounded-2xl border border-gray-50 whitespace-pre-wrap italic">"{selectedJob.description}"</p></div><div className="space-y-4"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Requirements</p><div className="grid grid-cols-1 gap-2">{selectedJob.requirements?.map((req, i) => (
                    <div key={i} className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-100 rounded-xl">
                      <span className="material-icons-round text-primary text-sm">check_circle</span>
                      <span className="text-[10px] font-bold text-gray-700">{req}</span>
                    </div>
                  ))}</div></div></div><div className="p-8 pt-0"><button onClick={() => setSelectedJob(null)} className="w-full py-5 bg-accent text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Dismiss View</button></div></div></div>
         )}
      </main>
      {showStatusNotif.show && (
         <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[300] bg-accent text-white px-8 py-5 rounded-[2.5rem] shadow-premium flex items-center gap-4 animate-slide-up whitespace-nowrap border-4 border-white/20 backdrop-blur-md"><div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0"><span className="material-icons-round text-xl">email</span></div><div><p className="text-[10px] font-black uppercase tracking-widest opacity-70">Notification Sent</p><h4 className="text-sm font-bold">{showStatusNotif.name} was marked as {showStatusNotif.status}</h4></div></div>
      )}
    </div>
  );
};



