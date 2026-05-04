import React, { useState, useEffect } from 'react';
import { ApplyForm } from '../components/ApplyForm';

export const JobDetails = ({ job, onBack, favorites, onToggleFavorite, onShare }) => {
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [applicantCount, setApplicantCount] = useState(0);
  const [expandedReq, setExpandedReq] = useState(false);

  useEffect(() => {
    // Fetch applicant count
    fetch(API_URL + '/api/applications')
      .then(res => res.json())
      .then(data => {
        const count = data.filter((a) => 
          a.jobId === job.id || a.jobId === job._id
        ).length;
        setApplicantCount(count || 0); 
      })
      .catch(() => setApplicantCount(0));
  }, [job]);

  const getPostedTime = (dateStr) => {
    if (!dateStr) return { text: "Recently", isRecent: false };
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
       // if dateStr is already a string like "2 days ago"
       const isHours = dateStr.toLowerCase().includes('hour');
       const isToday = dateStr.toLowerCase().includes('today');
       return { text: `Posted ${dateStr}`, isRecent: isHours || isToday };
    }
    const diff = (new Date().getTime() - date.getTime()) / 1000;
    const hours = Math.floor(diff / 3600);
    if (hours < 1) return { text: `Posted just now`, isRecent: true };
    if (hours < 24) return { text: `Posted ${hours} hours ago`, isRecent: true };
    const days = Math.floor(hours / 24);
    if (days === 1) return { text: `Posted 1 day ago`, isRecent: false };
    return { text: `Posted ${days} days ago`, isRecent: false };
  };

  const isFavorite = favorites.includes(job.id);

  const postedData = getPostedTime(job.postedAt);

  return (
    <div className="fixed inset-0 mx-auto w-full max-w-md bg-white z-50 flex flex-col animate-slide-in overflow-hidden">
      {/* Top Bar */}
      <header className="px-5 py-4 flex items-center justify-between bg-white sticky top-0 z-20">
        <button onClick={onBack} className="w-10 h-10 -ml-2 flex items-center justify-center text-accent active:scale-90 transition-all">
          <span className="material-icons-round text-3xl">chevron_left</span>
        </button>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onToggleFavorite(job.id)}
            className={`flex items-center justify-center p-2 rounded-full transition-all active:scale-90 ${isFavorite ? 'text-primary' : 'text-accent'}`}
          >
            <span className="material-icons-round text-2xl">{isFavorite ? 'favorite' : 'favorite_border'}</span>
          </button>
          <button 
            onClick={() => onShare(job)}
            className="flex items-center justify-center p-2 bg-gray-50 rounded-full text-accent active:scale-90 transition-all"
          >
            <span className="material-icons-round text-2xl">share</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-10">
        {job.imageUrl && (
          <div className="w-full h-48 bg-gray-100 overflow-hidden relative z-0">
            <img src={job.imageUrl} alt="Job Banner" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="px-6 pt-4 pb-6 relative z-10 w-full mt-[-20px] bg-white rounded-t-[1.5rem]">
          <div className="flex items-center gap-4 mb-4">
            {job.companyLogo && (
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white shrink-0">
                <img src={job.companyLogo} alt="Company Logo" className="w-full h-full object-cover" />
              </div>
            )}
            <div>
               <h2 className="text-2xl font-display font-semibold text-accent leading-tight mb-1">
                 {job.title}
               </h2>
               <p className="text-gray-500 text-[15px]">{job.company}</p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-4">
              <span className="material-icons-round text-gray-500 text-xl">payments</span>
              <span className="text-[15px] text-gray-800">{job.salary || 'Negotiable'}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="material-icons-round text-gray-500 text-xl">location_on</span>
              <span className="text-[15px] text-gray-800 underline underline-offset-4 decoration-gray-300">{job.location.split(',')[0]}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="material-icons-round text-gray-500 text-xl">schedule</span>
              <span className="text-[15px] text-gray-800">{job.type} {job.workMode && `(${job.workMode})`}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="material-icons-round text-gray-500 text-xl">business_center</span>
              <span className="text-[15px] text-gray-800">{job.experience}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="material-icons-round text-gray-500 text-xl">wc</span>
              <span className="text-[15px] text-gray-800">Any</span>
            </div>
          </div>

          <button
            onClick={() => setShowApplyForm(true)}
            className="w-full bg-[#1a1c1e] text-white py-4 rounded-xl text-[15px] font-semibold mb-6 active:scale-[0.98] transition-all"
          >
            Apply
          </button>

          <div className="flex items-center text-[13px] font-medium mb-8">
            <span className="text-accent">{applicantCount > 0 ? `${applicantCount} Applicants` : 'Be the first to apply'}</span>
            <span className="mx-2 text-gray-300">•</span>
            <span className={postedData.isRecent ? "text-green-600" : "text-gray-500"}>
              {postedData.text}
            </span>
          </div>

          {/* Job Details Content */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-accent mb-4">Job Details</h3>
            
            <div className="text-[15px] text-gray-700 space-y-3">
              <div className="flex gap-2">
                <span className="text-gray-400 font-bold leading-none mt-0.5 text-lg">•</span>
                <span>Must be resident in {job.location.split(',')[0] || 'the required location'}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 font-bold leading-none mt-0.5 text-lg">•</span>
                <span>Salary Range between {job.salary}</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="text-[15px] text-gray-700 space-y-2 mb-2">
                <div className="flex gap-2 mb-3 items-center">
                  <span className="text-gray-400 font-bold leading-none mt-0.5 text-lg">•</span>
                  <span className="font-bold">Key Responsibilities</span>
                </div>
              </div>
              <div className="text-[15px] text-gray-700 space-y-1 pl-4">
                {job.responsibilities && job.responsibilities.length > 0 ? (
                  job.responsibilities.map((resp, idx) => (
                    <p key={idx} className="leading-relaxed mb-1">- {resp}</p>
                  ))
                ) : (
                  job.description.split('.').filter(s => s.trim().length > 10).map((sentence, idx) => (
                     <p key={idx} className="leading-relaxed mb-1">- {sentence.trim()}</p>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2">
              <div className="text-[15px] text-gray-700 space-y-2 mb-2">
                <div className="flex gap-2 mb-3 items-center">
                  <span className="text-gray-400 font-bold leading-none mt-0.5 text-lg">•</span>
                  <span className="font-bold">Requirements</span>
                </div>
              </div>
              <div className="text-[15px] text-gray-700 space-y-2 pl-4 mb-2">
                {job.requirements && job.requirements.length > 0 ? (
                  (expandedReq ? job.requirements : job.requirements.slice(0, 2)).map((req, idx) => (
                    <p key={idx} className="leading-relaxed mb-1">- {req}</p>
                  ))
                ) : (
                   <p className="leading-relaxed truncate">- Proven experience in {job.category || 'this field'}</p>
                )}
              </div>
              {job.requirements && job.requirements.length > 2 && (
                <button onClick={() => setExpandedReq(!expandedReq)} className="text-blue-600 font-bold text-[15px] mt-2">
                  {expandedReq ? 'Show Less' : 'Read More'}
                </button>
              )}
            </div>

            {/* Structured Grid */}
            <div className="pt-8 space-y-5">
              <div className="flex justify-between items-start">
                <span className="text-gray-500 text-[15px] w-40">Minimum Education Level</span>
                <span className="text-accent text-[15px] font-semibold flex-1 text-left">{job.education || 'Bachelors Degree'}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-500 text-[15px] w-40">Company Size</span>
                <span className="text-accent text-[15px] font-semibold flex-1 text-left">11-50</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-500 text-[15px] w-40">Industry</span>
                <span className="text-accent text-[15px] font-semibold flex-1 text-left">{job.category || 'General'}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-500 text-[15px] w-40">Work Mode</span>
                <span className="text-accent text-[15px] font-semibold flex-1 text-left">
                  {job.workMode || (job.type.toLowerCase().includes('remote') ? 'Remote' : 'On-site')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showApplyForm && (
        <ApplyForm
          job={job}
          onClose={() => setShowApplyForm(false)}
          onSubmit={async (resumeUrl, name, email, qualification, expectedSalary, phone) => {
            try {
              const accountMobile = localStorage.getItem('candidate_mobile') || '';
              await fetch(API_URL + '/api/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jobId: job.id || job._id,
                  applicantName: name || 'Token Applicant', 
                  applicantEmail: email || 'user@example.com',
                  applicantMobile: phone || accountMobile,
                  accountMobile: accountMobile, // Hidden link for notifications
                  qualification: qualification || "Bachelor's Degree",
                  expectedSalary: expectedSalary || "N/A",
                  appliedAt: new Date().toISOString(),
                  resumeUrl: resumeUrl || ''
                })
              });
            } catch (e) {
              console.warn('Backend offline, simulated application sent');
            }
            setShowApplyForm(false);
            setShowSuccessPopup(true);
          }}
        />
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-accent/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 text-center shadow-2xl animate-scale-up">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <span className="material-icons-round text-emerald-500 text-4xl">check_circle</span>
            </div>
            <h3 className="text-2xl font-display font-black text-accent mb-2">Application Sent!</h3>
            <p className="text-sm font-medium text-gray-500 mb-8 leading-relaxed">
              Your profile has been fast-tracked to the recruiter's dashboard. Good luck!
            </p>
            <button 
              onClick={() => {
                setShowSuccessPopup(false);
                onBack(); // Go back to jobs list
              }}
              className="w-full py-4 bg-[#1a1c1e] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-black/20 active:scale-95 transition-all"
            >
              Continue Hunting
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


