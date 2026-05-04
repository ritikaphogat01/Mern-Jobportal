import React, { useState, useEffect } from 'react';
import { AppScreen } from '../types';

export const Menu = ({ onBack, onDownload, onNavigate, hasApprovedJob = false, hasPaidJob = false }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [candidateName, setCandidateName] = useState(null);
  const [candidateMobile, setCandidateMobile] = useState(null);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [hasBoughtPlan, setHasBoughtPlan] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem('candidate_name');
    const mobile = localStorage.getItem('candidate_mobile');
    const id = localStorage.getItem('candidate_id');
    const recruiterEmail = localStorage.getItem('recruiter_email');

    if (name || id || recruiterEmail) {
      setIsUserLoggedIn(true);
      setCandidateName(name || recruiterEmail || 'User');
      setCandidateMobile(mobile || recruiterEmail || '');

      // Fetch notifications
      const email = localStorage.getItem('candidate_email') || recruiterEmail;
      if (email) {
        fetch(`/api/notifications/${email}`)
          .then(res => res.json())
          .then(data => { if (Array.isArray(data)) setNotifications(data); })
          .catch(console.error);
      }
    }

    if (mobile) {
      fetch('/api/candidates')
        .then(res => res.json())
        .then(data => {
          const cand = data.find((c) => c.mobile === mobile);
          if (cand && cand.hasBoughtPlan) setHasBoughtPlan(true);
        })
        .catch(console.error);
    }
  }, []);

  const allModules = [
    { title: 'Post a Job', desc: 'Find talent quickly & easily', icon: 'add_task', color: 'bg-blue-50 text-blue-600', shadow: 'shadow-blue-100', screen: AppScreen.POST_JOB },
    { title: 'Employer Dashboard', desc: 'Manage your vacancies & candidates', icon: 'business_center', color: 'bg-emerald-50 text-emerald-600', shadow: 'shadow-emerald-100', screen: AppScreen.RECRUITER_DASHBOARD, recruiterOnly: true },
    { title: 'Post Visibility Boost', desc: 'Reach 10x more recruiters instantly', icon: 'rocket_launch', color: 'bg-indigo-50 text-indigo-600', shadow: 'shadow-indigo-100', screen: AppScreen.SERVICE_DETAILS, type: 'BOOST' },
    { title: 'Gold Verification', desc: 'Build instant authority & trust', icon: 'verified', color: 'bg-green-50 text-green-600', shadow: 'shadow-green-100', screen: AppScreen.SERVICE_DETAILS, type: 'GOLD' },
    { title: 'Top-of-Search Ad', desc: 'Stay at the absolute peak for 7 days', icon: 'visibility', color: 'bg-orange-50 text-orange-600', shadow: 'shadow-orange-100', screen: AppScreen.SERVICE_DETAILS, type: 'AD' },
  ];

  const modules = allModules;

  return (
    <div className="animate-fade-in pb-32 min-h-full bg-[#F8FAFC]">
      <header className="bg-white/80 backdrop-blur-lg px-6 py-5 sticky top-0 z-30 flex items-center gap-5 border-b border-gray-100/50">
        <button onClick={onBack} className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-accent active:scale-90 transition-all">
          <span className="material-icons-round">arrow_back</span>
        </button>
        <div className="text-xl font-display font-extrabold text-accent">Account & Wallet</div>
      </header>

      <div className="p-6">


        <div className="space-y-4">
          <div className="text-accent font-display font-bold text-sm ml-2">Quick Services</div>
          {modules.map((m, idx) => (
            <div
              key={idx}
              onClick={() => m.screen && onNavigate(m.screen, m.type)}
              className="bg-white p-6 rounded-[2rem] border border-gray-100/50 shadow-card flex items-center justify-between group active:scale-[0.98] transition-all hover:border-primary/20 cursor-pointer"
            >
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 ${m.color} rounded-2xl flex items-center justify-center ${m.shadow} shadow-lg transition-transform group-hover:scale-110`}>
                  <span className="material-icons-round text-2xl">{m.icon}</span>
                </div>
                <div className="pr-4">
                  <h4 className="font-bold text-accent text-[15px] group-hover:text-primary transition-colors">{m.title}</h4>
                  <p className="text-[11px] text-gray-700 font-semibold mt-1 leading-snug">{m.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>


      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-slide-up text-center">
            <div className="w-16 h-16 bg-red-50 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="material-icons-round text-3xl">power_settings_new</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Sign Out?</h3>
            <p className="text-sm text-gray-800 font-medium mb-8">Are you sure you want to logout from Token?</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  localStorage.clear();
                  setShowLogoutConfirm(false);
                  onNavigate(AppScreen.ROLE_SELECTION);
                }}
                className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all"
              >
                Logout Now
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full py-4 bg-gray-50 text-gray-700 font-bold rounded-2xl active:bg-gray-100 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATION DETAIL MODAL */}
      {showNotifModal && selectedNotif && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-accent/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl animate-slide-up text-center relative">
            <div className={`w-20 h-20 rounded-[2rem] mx-auto mb-6 flex items-center justify-center ${selectedNotif.type === 'error' ? 'bg-red-50 text-primary' : 'bg-emerald-50 text-emerald-600'}`}>
              <span className="material-icons-round text-4xl">{selectedNotif.type === 'error' ? 'notification_important' : 'verified_user'}</span>
            </div>
            <h3 className="text-xl font-display font-black text-accent mb-2">{selectedNotif.title}</h3>
            <p className="text-sm text-gray-600 font-medium leading-relaxed mb-8">
              {selectedNotif.message}
            </p>
            <button
              onClick={() => setShowNotifModal(false)}
              className="w-full py-5 bg-accent text-white font-display font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl active:scale-95 transition-all"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
