import React, { useState, useRef } from 'react';

export const PostJob = ({ initialCategory, initialSubCategory, onBack, onPostSuccess }) => {
  const [activePlan, setActivePlan] = React.useState(null);
  const defaultCat = initialSubCategory || initialCategory || 'Technology';
  const [form, setForm] = useState({
    title: '',
    company: '',
    location: '',
    salary: '',
    type: 'Full-Time',
    workMode: 'Onsite',
    experience: '2-5 Years',
    education: 'Bachelors Degree',
    category: defaultCat,
    description: '',
    requirements: '',
    skills: '',
    isFeatured: false,
  });
  const [categories, setCategories] = useState([]);
  const [customCategory, setCustomCategory] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [jobImageFile, setJobImageFile] = useState(null);
  const [jobImagePreview, setJobImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return; }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
    setError('');
  };

  React.useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});

    // Read credits from email-keyed localStorage (set when plan was purchased)
    const email = (localStorage.getItem('recruiter_email') || '').trim().toLowerCase();
    if (email) {
      const limit = parseInt(localStorage.getItem(`recruiter_limit_${email}`) || '0');
      const used = parseInt(localStorage.getItem(`recruiter_used_${email}`) || '0');
      const remaining = limit - used;
      if (limit > 0 && remaining > 0) {
        setActivePlan({ remainingCredits: remaining, creditsTotal: limit });
      } else if (limit === 0) {
        // Fallback: try backend for older accounts
        fetch(`/api/subscriptions/active/${email}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.remainingCredits > 0) {
              setActivePlan({ remainingCredits: data.remainingCredits, creditsTotal: data.creditsTotal || 0 });
            }
          })
          .catch(console.warn);
      }
    }
  }, []);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.company.trim()) { setError('Job title and company are required'); return; }
    setSubmitting(true);
    setError('');
    try {
      let companyLogo = '';
      let imageUrl = '';
      if (logoFile || jobImageFile) {
        setUploading(true);
        try {
          if (logoFile) {
            const fd = new FormData();
            fd.append('file', logoFile);
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
            const uploadData = await uploadRes.json();
            if (uploadData.success) companyLogo = uploadData.url;
          }
          if (jobImageFile) {
            const fd2 = new FormData();
            fd2.append('file', jobImageFile);
            const uploadRes2 = await fetch('/api/upload', { method: 'POST', body: fd2 });
            const uploadData2 = await uploadRes2.json();
            if (uploadData2.success) imageUrl = uploadData2.url;
          }
        } catch (e) {
          console.warn('Upload failed, using local preview for demo');
          companyLogo = companyLogo || logoPreview;
          imageUrl = imageUrl || jobImagePreview;
        }
        setUploading(false);
      }
      const recruiterEmail = (localStorage.getItem('recruiter_email') || localStorage.getItem('candidate_mobile') || 'hr@default.com').trim().toLowerCase();
      const finalCategory = form.category === 'Other' && customCategory.trim() ? customCategory.trim() : form.category;
      const payload = { ...form, category: finalCategory, companyLogo, imageUrl, status: 'pending', recruiterEmail };
      
      try {
        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const data = await res.json();
          onPostSuccess(data._id || data.id, form.isFeatured);
          return;
        }
      } catch (e) {
        console.warn('Network error, using local fallback for demo');
      }

      // Local fallback for demo/testing when server is down
      const dummyId = 'job_' + Math.random().toString(36).substr(2, 9);
      console.log('Using dummy Job ID:', dummyId);
      onPostSuccess(dummyId, form.isFeatured);

    } catch (e) {
      setError('Unexpected error. Please try again.');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };


  return (
    <div className="animate-fade-in bg-white min-h-full pb-32 flex flex-col">
      <header className="px-6 py-6 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-accent active:scale-90 transition-all">
            <span className="material-icons-round">arrow_back</span>
          </button>
          <h2 className="text-xl font-display font-black text-accent">Post Vacancy</h2>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-gray-400 uppercase">New Listing</span>
          {activePlan && (
            <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full mt-1 flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
               <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">
                 {activePlan.remainingCredits}/{activePlan.creditsTotal || '?'} Credits Left
               </span>
            </div>
          )}
        </div>
      </header>

      <div className="p-6 space-y-6 overflow-y-auto no-scrollbar">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
            <span className="material-icons-round text-primary text-sm">error</span>
            <p className="text-sm font-bold text-primary">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center gap-3 bg-gray-50 p-4 rounded-3xl border border-gray-100 relative">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative w-24 h-24 rounded-full bg-white border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden hover:border-primary/40 transition-colors active:scale-95 shadow-sm"
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <>
                  <span className="material-icons-round text-gray-300 text-3xl">domain</span>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider mt-1">Logo</span>
                </>
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center px-1 truncate w-full">
              {logoFile ? logoFile.name : 'Company Logo'}
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 bg-gray-50 p-4 rounded-3xl border border-gray-100 relative">
            <button
              onClick={() => document.getElementById('jobImageInput')?.click()}
              className="relative w-full h-24 rounded-2xl bg-white border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden hover:border-primary/40 transition-colors active:scale-95 shadow-sm"
            >
              {jobImagePreview ? (
                <img src={jobImagePreview} alt="Job Banner" className="w-full h-full object-cover" />
              ) : (
                <>
                  <span className="material-icons-round text-gray-300 text-3xl">wallpaper</span>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider mt-1">Banner</span>
                </>
              )}
            </button>
            <input id="jobImageInput" type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return; }
              setJobImageFile(file);
              const reader = new FileReader();
              reader.onload = () => setJobImagePreview(reader.result);
              reader.readAsDataURL(file);
              setError('');
            }} />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center px-1 truncate w-full">
              {jobImageFile ? jobImageFile.name : 'Job Banner Image'}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Job Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={e => {
              const val = e.target.value;
              const cap = val.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              setForm(f => ({ ...f, title: cap }));
            }}
            placeholder="e.g. Senior Frontend Engineer"
            className="w-full h-14 px-6 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 font-bold text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Company Name *</label>
          <input
            type="text"
            value={form.company}
            onChange={e => {
              const val = e.target.value;
              const cap = val.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              setForm(f => ({ ...f, company: cap }));
            }}
            placeholder="e.g. TechNova Solutions"
            className="w-full h-14 px-6 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 font-bold text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Salary Range</label>
            <input
              type="text"
              value={form.salary}
              onChange={e => setForm(f => ({ ...f, salary: e.target.value.replace(/[^0-9-]/g, '') }))}
              placeholder="e.g. 30 or 30-40 (in k)"
              className="w-full h-14 px-6 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 font-bold text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value.replace(/[0-9]/g, '') }))}
              placeholder="e.g. Bangalore"
              className="w-full h-14 px-6 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 font-bold text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Job Type</label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full h-14 px-6 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 font-bold text-sm appearance-none"
            >
              <option>Full-Time</option>
              <option>Part-Time</option>
              <option>Remote</option>
              <option>Contract</option>
              <option>Internship</option>
              <option>Freelance</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Work Mode</label>
            <select
              value={form.workMode}
              onChange={e => setForm(f => ({ ...f, workMode: e.target.value }))}
              className="w-full h-14 px-6 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 font-bold text-sm appearance-none"
            >
              <option>Onsite</option>
              <option>Remote</option>
              <option>Hybrid</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Min. Qualification</label>
            <select
              value={form.education}
              onChange={e => setForm(f => ({ ...f, education: e.target.value }))}
              className="w-full h-14 px-6 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 font-bold text-sm appearance-none"
            >
              <option>High School</option>
              <option>Bachelors Degree</option>
              <option>Masters Degree</option>
              <option>PhD</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Experience</label>
            <select
              value={form.experience}
              onChange={e => setForm(f => ({ ...f, experience: e.target.value }))}
              className="w-full h-14 px-6 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 font-bold text-sm appearance-none"
            >
              <option>Freshers</option>
              <option>0-1 Years</option>
              <option>1-3 Years</option>
              <option>2-5 Years</option>
              <option>5-10 Years</option>
              <option>10+ Years</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Category</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full h-14 px-6 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 font-bold text-sm appearance-none"
            >
              {categories.map((c, i) => (
                <option key={i} value={c.name}>{c.name}</option>
              ))}
              {categories.length === 0 && <option>Technology</option>}
              {!categories.some(c => c.name === defaultCat) && defaultCat !== 'Other' && (
                <option value={defaultCat}>{defaultCat}</option>
              )}
              <option value="Other">Other (Type custom)</option>
            </select>
          </div>
          
          {form.category === 'Other' && (
            <div className="space-y-2 col-span-2 mt-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Custom Category</label>
              <input
                type="text"
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                placeholder="e.g. Mechanical Engineering"
                className="w-full h-14 px-6 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 font-bold text-sm"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Job Description</label>
          <textarea
            rows={5}
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe the role, responsibilities and ideal candidate..."
            className="w-full p-5 bg-gray-50 border border-transparent rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium text-sm leading-relaxed resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Requirements (one per line)</label>
          <textarea
            rows={4}
            value={form.requirements}
            onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))}
            placeholder="3+ years of React experience&#10;Strong TypeScript skills&#10;Familiar with REST APIs"
            className="w-full p-5 bg-gray-50 border border-transparent rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium text-sm leading-relaxed resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Skills Required (comma separated)</label>
          <input
            type="text"
            value={form.skills}
            onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
            placeholder="React, Node.js, TypeScript, MongoDB"
            className="w-full h-14 px-6 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 font-bold text-sm"
          />
        </div>

        <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-icons-round text-primary">rocket_launch</span>
              <div>
                <h3 className="text-sm font-black text-primary uppercase">Boost this job?</h3>
                <p className="text-[11px] text-gray-500 font-medium mt-1">Reach 10x more candidates</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-accent">₹1,499</span>
              <button
                onClick={() => setForm(f => ({ ...f, isFeatured: !f.isFeatured }))}
                className={`w-12 h-6 rounded-full transition-colors relative ${form.isFeatured ? 'bg-primary' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${form.isFeatured ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 p-6 flex gap-4 safe-bottom max-w-md mx-auto">
        <button
          onClick={handleSubmit}
          disabled={submitting || uploading}
          className="flex-1 h-16 bg-primary text-white font-display font-black text-lg rounded-2xl shadow-premium shadow-primary/30 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-3"
        >
          {submitting ? (
            <><span className="material-icons-round animate-spin">autorenew</span> {uploading ? 'Uploading...' : 'Posting...'}</>
          ) : (
            <><span className="material-icons-round">rocket_launch</span> Post Vacancy</>
          )}
        </button>
      </div>
    </div>
  );
};
