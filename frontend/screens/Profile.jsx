import React, { useState, useRef, useEffect } from 'react';
import { AppScreen } from '../types';

export const Profile = ({ onBack, onNavigate, hasPaidJob = false }) => {
  const [profile, setProfile] = useState({
    name: localStorage.getItem('candidate_name') || '',
    role: localStorage.getItem('candidate_role') || '',
    experience: localStorage.getItem('candidate_experience') || '',
    skills: localStorage.getItem('candidate_skills') || '',
    mobile: localStorage.getItem('candidate_mobile') || '',
    phone: localStorage.getItem('candidate_phone') || '',
    resumeUrl: localStorage.getItem('candidate_resume') || '',
    photoUrl: localStorage.getItem('candidate_photo') || ''
  });

  const [showLegal, setShowLegal] = useState(false);
  const [showPhotoView, setShowPhotoView] = useState(false);
  const [candidateId, setCandidateId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);

  const handlePhotoDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your profile photo?')) return;
    setProfile(prev => ({ ...prev, photoUrl: '' }));
    localStorage.removeItem('candidate_photo');
    try {
      const resList = await fetch('/api/candidates');
      const candidates = await resList.json();
      const existing = candidates.find((c) => c.mobile === profile.mobile);
      if (existing) {
        await fetch(`/api/candidates/${existing._id || existing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...existing, ...profile, photoUrl: '' })
        });
      }
    } catch (e) {
      console.error('Delete photo failed', e);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setProfile(prev => ({ ...prev, photoUrl: data.url }));
        localStorage.setItem('candidate_photo', data.url);
        
        // Auto-save the photo to backend
        const resList = await fetch('/api/candidates');
        const candidates = await resList.json();
        const existing = candidates.find((c) => c.mobile === profile.mobile);
        if (existing) {
          await fetch(`/api/candidates/${existing._id || existing.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...existing, ...profile, photoUrl: data.url })
          });
        }
      }
    } catch (err) {
      console.error('Photo upload failed', err);
    } finally {
      setIsUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setProfile(prev => ({ ...prev, resumeUrl: data.url }));
        localStorage.setItem('candidate_resume', data.url);
        
        // Auto-save the resume to backend
        const resList = await fetch('/api/candidates');
        const candidates = await resList.json();
        const existing = candidates.find((c) => c.mobile === profile.mobile);
        if (existing) {
          await fetch(`/api/candidates/${existing._id || existing.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...existing, ...profile, resumeUrl: data.url })
          });
        }
      }
    } catch (err) {
      console.error('Upload failed', err);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResumeDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your resume?')) return;
    setProfile(prev => ({ ...prev, resumeUrl: '' }));
    try {
      const resList = await fetch('/api/candidates');
      const candidates = await resList.json();
      const existing = candidates.find((c) => c.mobile === profile.mobile);
      if (existing) {
        await fetch(`/api/candidates/${existing._id || existing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...existing, ...profile, resumeUrl: '' })
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Check if THIS specific logged-in user has ever purchased a recruiter plan 
  const [hasEverPurchasedPlan, setHasEverPurchasedPlan] = useState(false);

  // Load existing profile from backend and sync with localStorage
  useEffect(() => {
    const mobile = localStorage.getItem('candidate_mobile');
    if (!mobile) return;

    fetch('/api/candidates')
      .then(res => res.json())
      .then(data => {
        const myProfile = data.find((c) => c.mobile === mobile);
        if (myProfile) {
          const rawName = myProfile.name || '';
          const capitalizedName = rawName.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ');

          const updatedProfile = {
            name: capitalizedName,
            role: myProfile.role || '',
            experience: myProfile.experience || '',
            skills: myProfile.skills || '',
            mobile: myProfile.mobile || mobile,
            phone: myProfile.phone || '',
            resumeUrl: myProfile.resumeUrl || '',
            photoUrl: myProfile.photoUrl || ''
          };
          setProfile(updatedProfile);
          setCandidateId(myProfile._id || myProfile.id);
          
          // Sync to localStorage
          localStorage.setItem('candidate_name', updatedProfile.name);
          localStorage.setItem('candidate_role', updatedProfile.role);
          localStorage.setItem('candidate_experience', updatedProfile.experience);
          localStorage.setItem('candidate_skills', updatedProfile.skills);
          localStorage.setItem('candidate_resume', updatedProfile.resumeUrl);
          localStorage.setItem('candidate_photo', updatedProfile.photoUrl);
          localStorage.setItem('candidate_phone', updatedProfile.phone);

          if (myProfile.hasBoughtPlan) {
            setHasEverPurchasedPlan(true);
          }
        }
      }).catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Find if candidate exists to PUT, else POST
      let existing = null;
      if (candidateId) {
        const resList = await fetch('/api/candidates');
        const candidates = await resList.json();
        existing = candidates.find((c) => (c._id || c.id) === candidateId);
      } else {
        // Fallback search by mobile if no ID yet
        const resList = await fetch('/api/candidates');
        const candidates = await resList.json();
        existing = candidates.find((c) => c.mobile === profile.mobile);
      }

      if (existing) {
        await fetch(`/api/candidates/${existing._id || existing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...existing, ...profile, status: 'Active', email: profile.mobile })
        });
      } else {
        await fetch('/api/candidates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...profile, 
            status: 'Active', 
            email: profile.mobile.includes('@') ? profile.mobile : (profile.mobile + '@example.com') 
          })
        });
      }

      // ALWAYS save to localStorage for persistence
      localStorage.setItem('candidate_name', profile.name);
      localStorage.setItem('candidate_role', profile.role);
      localStorage.setItem('candidate_experience', profile.experience);
      localStorage.setItem('candidate_skills', profile.skills);
      localStorage.setItem('candidate_resume', profile.resumeUrl);
      localStorage.setItem('candidate_photo', profile.photoUrl);
      localStorage.setItem('candidate_phone', profile.phone);

      setIsEditing(false);
    } catch (err) {
      console.error('Save failed:', err);
      // Even if backend fails, localStorage keeps it
      localStorage.setItem('candidate_name', profile.name);
      localStorage.setItem('candidate_role', profile.role);
      localStorage.setItem('candidate_experience', profile.experience);
      localStorage.setItem('candidate_skills', profile.skills);
      localStorage.setItem('candidate_resume', profile.resumeUrl);
      localStorage.setItem('candidate_photo', profile.photoUrl);
      setIsEditing(false);
    }
    setSaving(false);
  };

  const calculateCompletion = () => {
    let score = 20; // Base score for logging in
    if (profile.name) score += 20;
    if (profile.role) score += 20;
    if (profile.experience) score += 20;
    if (profile.skills) score += 20;
    return Math.min(score, 100);
  };

  const completion = calculateCompletion();
  const pending = [];
  if (!profile.experience) pending.push('Add Experience Details');
  if (!profile.skills) pending.push('Add Key Skills');

  // Build quick links — show Employer Dashboard for users who have purchased a plan or are registered recruiters
  const quickLinks = [
    { label: 'My Applications', icon: 'assignment', screen: AppScreen.TRACKER },
    { label: 'Job Alerts', icon: 'notifications_active', screen: AppScreen.HOME },
    { label: 'AI Career Coach', icon: 'psychology', screen: AppScreen.AI_COACH },
  ];


  return (
    <div className="animate-fade-in bg-white min-h-full pb-32 relative">
      <header className="px-6 py-4 flex items-center justify-between border-b border-gray-50 sticky top-0 bg-white z-30 shadow-sm">
        <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 rounded-[12px] bg-gray-50 flex items-center justify-center text-accent active:scale-95 transition-all outline-none">
          <span className="material-icons-round font-medium text-[22px]">menu</span>
        </button>
        <h2 className="text-xl font-display font-black text-accent tracking-tight">My Dashboard</h2>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center text-primary active:scale-95 transition-all outline-none">
            <span className="material-icons-round font-medium text-[20px]">edit</span>
          </button>
        )}
      </header>
      
      {/* Sidebar Overlay Drawer */}
      {isSidebarOpen && (
        <div className="absolute inset-0 z-[100] flex pointer-events-none overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto animate-fade-in"
            onClick={() => setIsSidebarOpen(false)}
          />
          
          {/* Drawer Panel */}
          <div className="relative w-full max-w-[280px] h-full bg-white shadow-2xl pointer-events-auto animate-slide-right flex flex-col">
            <div className="px-6 py-8 border-b border-gray-100 flex flex-col bg-gradient-to-tr from-accent to-gray-800">
              <div className="flex justify-between items-start mb-4">
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white font-black text-2xl shadow-lg ring-4 ring-white/20">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-95 transition-all">
                  <span className="material-icons-round text-[20px]">close</span>
                </button>
              </div>
              <div>
                <h3 className="font-display font-black leading-tight text-white mb-1 truncate">{profile.name || 'User Dashboard'}</h3>
                <p className="text-[12px] font-bold text-gray-400 truncate flex items-center gap-1">
                  <span className="material-icons-round text-[14px]">smartphone</span>
                  {profile.mobile}
                </p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pt-4 pb-20 space-y-1 px-3 no-scrollbar">
              <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-4 py-3">Profile Data</div>
              
              <button onClick={() => { setIsSidebarOpen(false); setIsEditing(true); }} className="w-full flex items-center gap-4 px-4 py-[14px] rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                  <span className="material-icons-round text-[18px]">person</span>
                </div>
                <span className="text-[15px] font-bold text-gray-700 group-hover:text-accent">Profile Details</span>
              </button>

              <button onClick={() => { setIsSidebarOpen(false); fileInputRef.current?.click(); }} className="w-full flex items-center gap-4 px-4 py-[14px] rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:scale-110 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm">
                  <span className="material-icons-round text-[18px]">upload_file</span>
                </div>
                <span className="text-[15px] font-bold text-gray-700 group-hover:text-accent">Resume Upload</span>
              </button>

              <button onClick={() => { setIsSidebarOpen(false); setIsEditing(true); }} className="w-full flex items-center gap-4 px-4 py-[14px] rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
                  <span className="material-icons-round text-[18px]">work_history</span>
                </div>
                <span className="text-[15px] font-bold text-gray-700 group-hover:text-accent">Experience</span>
              </button>


              <div className="my-2 mt-4 border-t border-gray-100 mx-4"></div>
              <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-4 py-3">Account Setup</div>

              <button onClick={() => { setIsSidebarOpen(false); onNavigate(AppScreen.MENU); }} className="w-full flex items-center gap-4 px-4 py-[14px] rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                  <span className="material-icons-round text-[18px]">workspace_premium</span>
                </div>
                <span className="text-[15px] font-bold text-gray-700 group-hover:text-accent">Plans & Tokens</span>
              </button>
              


              <button onClick={() => { setIsSidebarOpen(false); setShowLegal(true); setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 300); }} className="w-full flex items-center gap-4 px-4 py-[14px] rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group">
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:scale-110 group-hover:bg-slate-600 group-hover:text-white transition-all shadow-sm">
                  <span className="material-icons-round text-[18px]">gavel</span>
                </div>
                <span className="text-[15px] font-bold text-gray-700 group-hover:text-accent">Legal & Support</span>
              </button>

              <div className="pt-6 px-2">
                <button 
                  onClick={() => {
                    localStorage.clear();
                    onNavigate(AppScreen.ROLE_SELECTION);
                  }}
                  className="w-full flex items-center gap-3 justify-center px-4 py-[14px] bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl active:scale-95 transition-all outline-none"
                >
                  <span className="material-icons-round text-[20px]">power_settings_new</span>
                  Log Out Safely
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="p-6">
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
              <div 
                onClick={() => profile.photoUrl && setShowPhotoView(true)}
                className={`w-28 h-28 rounded-full bg-gradient-to-tr from-primary to-blue-500 overflow-hidden flex items-center justify-center text-white text-4xl font-display font-black shadow-xl border-4 border-white ${profile.photoUrl ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
              >
                {profile.photoUrl ? (
                  <img src={profile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  profile.name ? profile.name.charAt(0).toUpperCase() : 'U'
                )}
              </div>
              {isEditing && (
                <div 
                  onClick={() => photoInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 bg-primary w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-white shadow-lg cursor-pointer active:scale-90 transition-transform z-10"
                >
                  <span className="material-icons-round text-base">camera_alt</span>
                </div>
              )}
              <input type="file" ref={photoInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
            </div>

          {isEditing ? (
            <div className="w-full space-y-4 mt-4 bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-2">Full Name</label>
                <input 
                  type="text" 
                  value={profile.name} 
                  placeholder="Full Name"
                  onChange={e => {
                    const val = e.target.value;
                    const words = val.split(' ');
                    const capitalized = words.map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                    ).join(' ');
                    setProfile({ ...profile, name: capitalized });
                  }} 
                  className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 mt-1 focus:ring-2 focus:ring-primary/20 text-sm font-bold text-accent" 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-2">Professional Role</label>
                <input type="text" value={profile.role} onChange={e => setProfile({ ...profile, role: e.target.value })} placeholder="e.g. Graphic Designer" className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 mt-1 focus:ring-2 focus:ring-primary/20 text-sm font-bold text-accent" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-2">Experience</label>
                <input type="text" value={profile.experience} onChange={e => setProfile({ ...profile, experience: e.target.value })} placeholder="e.g. 2 Years" className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 mt-1 focus:ring-2 focus:ring-primary/20 text-sm font-bold text-accent" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-2">Top Skills (Comma separated)</label>
                <input type="text" value={profile.skills} onChange={e => setProfile({ ...profile, skills: e.target.value })} placeholder="e.g. Sales, English, Tally" className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 mt-1 focus:ring-2 focus:ring-primary/20 text-sm font-bold text-accent" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-2">Email</label>
                <input 
                  type="text" 
                  value={profile.mobile} 
                  onChange={e => setProfile({ ...profile, mobile: e.target.value })}
                  placeholder="name@gmail.com" 
                  className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 mt-1 focus:ring-2 focus:ring-primary/20 text-sm font-bold text-accent" 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-2">Phone</label>
                <input 
                  type="text" 
                  value={profile.phone} 
                  onChange={e => setProfile({ ...profile, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  placeholder="9876543210" 
                  maxLength={10}
                  className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 mt-1 focus:ring-2 focus:ring-primary/20 text-sm font-bold text-accent" 
                />
              </div>
              
              <div className="pt-2">
                <button 
                  onClick={handleSave} 
                  disabled={saving} 
                  className="w-full h-14 bg-gradient-to-r from-primary to-blue-600 text-white font-display font-bold rounded-2xl shadow-lg shadow-primary/20 active:scale-[0.97] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <span className="material-icons-round animate-spin">autorenew</span>
                  ) : (
                    <>SAVE CHANGES <span className="material-icons-round">check_circle</span></>
                  )}
                </button>
                <button 
                  onClick={() => setIsEditing(false)} 
                  className="w-full py-3 text-gray-400 font-bold text-xs uppercase tracking-widest mt-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <h3 className="text-2xl font-display font-black text-accent">{profile.name || 'User'}</h3>
              <p className="text-primary font-bold mt-1 max-w-[250px] mx-auto leading-tight">{profile.role || 'Job Seeker'}</p>
              <div className="flex gap-2 justify-center mt-3">
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><span className="material-icons-round text-sm">schedule</span> {profile.experience || 'Fresher'}</span>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><span className="material-icons-round text-sm">email</span> {profile.mobile || 'No Email'}</span>
              </div>
            </div>
          )}
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept=".pdf,.doc,.docx" 
          className="hidden" 
        />

        {/* Resume Section */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-[2.5rem] p-6 mb-8 border border-orange-100/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/50 rounded-full blur-3xl mix-blend-multiply -mr-10 -mt-10 pointer-events-none"></div>
          
           <div className="mb-4 relative z-10">
               <h4 className="text-[10px] font-black text-gray-700 uppercase tracking-widest">My Resume</h4>
           </div>
           
           {isUploading ? (
             <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center relative z-10">
               <span className="material-icons-round text-orange-400 text-3xl animate-spin mb-2">autorenew</span>
               <h5 className="font-bold text-accent text-xs">Uploading Resume...</h5>
             </div>
           ) : profile.resumeUrl ? (
             <div className="flex items-center justify-between bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm relative z-10">
               <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-4 flex-1 hover:opacity-70 transition-opacity">
                 <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100/50">
                   <span className="material-icons-round text-lg">picture_as_pdf</span>
                 </div>
                 <div>
                   <h5 className="font-bold text-accent text-sm truncate max-w-[150px]">My Resume</h5>
                   <div className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-500 mt-0.5">
                     <span className="material-icons-round text-[10px]">check_circle</span>
                     Uploaded
                   </div>
                 </div>
               </a>
               <button onClick={(e) => { e.preventDefault(); handleResumeDelete(); }} className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors ml-2 shrink-0">
                 <span className="material-icons-round text-[14px]">delete</span>
               </button>
             </div>
           ) : (
             <div onClick={() => fileInputRef.current?.click()} className="bg-white border focus:outline-none border-dashed border-orange-200 rounded-[2rem] p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition-all group relative z-10">
               <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-400 group-hover:scale-110 group-hover:bg-orange-100 transition-all mb-3 shadow-sm">
                 <span className="material-icons-round text-2xl">upload_file</span>
               </div>
               <h5 className="font-display font-bold text-accent text-sm mb-1">Upload Resume</h5>
               <p className="text-[10px] text-gray-500 font-medium">PDF, DOC, DOCX up to 5MB</p>
             </div>
           )}
        </div>

        {/* Completion Meter */}
        {completion < 100 && (
          <div className="bg-gray-50 rounded-[2.5rem] p-8 mb-8 border border-gray-100/50">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest mb-1">Profile Strength</p>
                <h4 className="text-2xl font-display font-black text-accent">{completion}% Complete</h4>
              </div>
              <span className={`material-icons-round text-4xl ${completion === 100 ? 'text-emerald-500' : 'text-orange-400'}`}>
                {completion === 100 ? 'verified_user' : 'gpp_maybe'}
              </span>
            </div>
            <div className="h-3 bg-white rounded-full overflow-hidden border border-gray-100 mb-6">
              <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${completion}%` }}></div>
            </div>

            {pending.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Pending Steps:</p>
                {pending.map((step, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 cursor-pointer" onClick={() => setIsEditing(true)}>
                    <span className="material-icons-round text-orange-400 text-sm">add_circle_outline</span>
                    <span className="text-xs font-bold text-gray-600">{step}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Skills Section */}
        <div className="mb-8 relative z-10">
          <div className="flex items-center justify-between mb-4 px-2">
            <h4 className="text-[10px] font-black text-gray-700 uppercase tracking-widest">My Expertise & Skills</h4>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsEditing(true)} className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-sm hover:scale-105 transition-transform">
                <span className="material-icons-round text-[16px]">add</span>
              </button>
            </div>
          </div>
          
          {profile.skills ? (
            <div className="flex flex-wrap gap-2">
              {profile.skills.split(',').filter(s => s.trim().length > 0).map((skill, index) => (
                <div key={index} className="px-4 py-2 bg-white border border-gray-100 shadow-sm rounded-xl text-xs font-bold text-accent flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  {skill.trim()}
                </div>
              ))}
            </div>
          ) : (
             <div className="bg-gray-50 rounded-2xl p-6 text-center border-2 border-dashed border-gray-200">
               <p className="text-xs font-bold text-gray-400 mb-3">No skills added yet</p>
               <button onClick={() => setIsEditing(true)} className="text-xs font-black text-primary uppercase tracking-wider">Add Your Top Skills</button>
             </div>
          )}
        </div>

        <div className="space-y-4">
          {quickLinks.map((item, i) => (
            <button
              key={i}
              onClick={() => onNavigate(item.screen)}
              className="w-full flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all group shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <span className="material-icons-round text-xl">{item.icon}</span>
                </div>
                <span className="text-sm font-bold text-gray-700">{item.label}</span>
              </div>
              <span className="material-icons-round text-gray-700">chevron_right</span>
            </button>
          ))}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-4">
            <button
              onClick={() => setShowLegal(!showLegal)}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform border border-slate-100">
                  <span className="material-icons-round text-xl">gavel</span>
                </div>
                <span className="text-sm font-bold text-gray-700">Legal & Support</span>
              </div>
              <span className={`material-icons-round text-gray-700 transition-transform duration-300 ${showLegal ? 'rotate-90 text-primary' : ''}`}>
                chevron_right
              </span>
            </button>
            
            {showLegal && (
              <div className="px-5 pb-5 animate-fade-in border-t border-gray-50 pt-2 space-y-2">
                {[
                  { title: 'Privacy Policy', screen: AppScreen.PRIVACY_POLICY, icon: 'shield' },
                  { title: 'Terms & Conditions', screen: AppScreen.TERMS_CONDITIONS, icon: 'description' },
                  { title: 'Return Policy', screen: AppScreen.RETURN_POLICY, icon: 'assignment_return' },
                  { title: 'Refund Policy', screen: AppScreen.REFUND_POLICY, icon: 'payments' },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => onNavigate(item.screen)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors group active:bg-slate-100 border border-transparent hover:border-slate-100 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors border border-slate-100">
                        <span className="material-icons-round text-lg">{item.icon}</span>
                      </div>
                      <span className="text-[13px] font-bold text-gray-700 group-hover:text-accent transition-colors">{item.title}</span>
                    </div>
                    <span className="material-icons-round text-gray-300 text-lg">arrow_forward</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 px-2 pb-8">
          <button 
            onClick={() => {
              if (window.confirm('Are you sure you want to log out?')) {
                localStorage.clear();
                onNavigate(AppScreen.ROLE_SELECTION);
              }
            }}
            className="w-full flex items-center gap-3 justify-center px-6 py-5 bg-red-50 hover:bg-red-500 hover:text-white text-red-600 font-display font-black rounded-3xl active:scale-95 transition-all outline-none border border-red-100 shadow-sm group"
          >
            <span className="material-icons-round text-xl group-hover:rotate-12 transition-transform">logout</span>
            <span>Log Out Account</span>
          </button>
          <p className="text-center text-[10px] font-black text-gray-400 mt-5 uppercase tracking-[0.3em] opacity-50">App Version 2.4.0 • Secure Session</p>
        </div>
      </div>
      {/* Photo View Overlay */}
      {showPhotoView && profile.photoUrl && (
        <div 
          className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-8 animate-fade-in"
          onClick={() => setShowPhotoView(false)}
        >
          <div className="relative max-w-full max-h-full" onClick={e => e.stopPropagation()}>
            <img 
              src={profile.photoUrl} 
              alt="Profile FullView" 
              className="max-w-[80vw] max-h-[60vh] rounded-3xl shadow-2xl border-2 border-white/20" 
            />
            <button 
              onClick={() => { handlePhotoDelete(); setShowPhotoView(false); }}
              className="absolute bottom-4 right-4 p-2 flex flex-col items-center group active:scale-90 transition-transform bg-white/20 backdrop-blur-md rounded-2xl hover:bg-white/40 border border-white/20"
            >
              <span className="material-icons-round text-red-500 text-3xl filter drop-shadow-lg">delete_forever</span>
              <span className="text-[9px] font-black uppercase text-white tracking-widest mt-0.5 drop-shadow-md">Delete Photo</span>
            </button>
            <button 
              onClick={() => setShowPhotoView(false)}
              className="absolute -top-10 right-0 text-white font-bold text-xs uppercase bg-white/10 px-3 py-1 rounded-full border border-white/20"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
