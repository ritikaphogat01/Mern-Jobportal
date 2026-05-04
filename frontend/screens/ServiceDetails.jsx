import React from 'react';

export const ServiceDetails = ({ type, onBack, onProceed }) => {
  const content = {
    GOLD: {
      title: 'Gold Verification',
      subtitle: 'Build instant authority & trust',
      icon: 'verified',
      color: 'from-amber-400 to-yellow-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      hero: 'Get the "Verified" tick on your profile and get 85% more profile clicks from top recruiters.',
      benefits: [
        { title: 'Trust Badge', desc: 'A prominent Gold tick that tells recruiters you are a genuine professional.', icon: 'military_tech' },
        { title: 'Priority Search', desc: 'Appear in a special "Verified Only" filter used by 90% of HR managers.', icon: 'search' },
        { title: 'Document Verified', desc: 'Securely verify your experience and education documents once.', icon: 'data_saver_off' },
        { title: 'Premium Support', desc: 'Direct access to our dedicated career assistance team.', icon: 'support_agent' }
      ],
      stats: '50K+ Professionals used Gold Verification to land jobs in March 2026.'
    },
    BOOST: {
      title: 'Profile Visibility Boost',
      subtitle: 'Reach 10x more recruiters instantly',
      icon: 'rocket_launch',
      color: 'from-indigo-500 to-purple-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      hero: 'Don\'t let your application get buried. Boost your profile to the top 1% of recruiter search results.',
      benefits: [
        { title: 'Top-of-List', desc: 'Your profile stays at the absolute top of the candidate list for every relevant job.', icon: 'vertical_align_top' },
        { title: 'Email Alerts', desc: 'Get your profile emailed directly to 20+ top hiring managers daily.', icon: 'mail_lock' },
        { title: 'Live Progress', desc: 'See who viewed your profile in real-time and get direct interview invites.', icon: 'query_stats' },
        { title: '10x Speed', desc: 'Boosted profiles get hired on average 10 days faster than normal ones.', icon: 'speed' }
      ],
      stats: 'Profiles with "Boost" receive 25+ interview calls per week on average.'
    },
    AD: {
      title: 'Top-of-Search Ad',
      subtitle: 'Dominate your category for 7 days',
      icon: 'visibility',
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      hero: 'Rent a dedicated prime-spot billboard on our search page. Perfect for aggressive hiring or career moves.',
      benefits: [
        { title: 'Prime Placement', desc: 'A dedicated large-format ad slot before any other search results.', icon: 'featured_video' },
        { title: 'High Engagement', desc: 'Get maximum clicks and profile views in your specific job category.', icon: 'ads_click' },
        { title: 'Eye-Catching', desc: 'Special visual effects and animations to grab recruiter attention.', icon: 'auto_awesome' },
        { title: 'Guaranteed Reach', desc: 'Minimum 5,000 targeted recruiter impressions guaranteed.', icon: 'groups' }
      ],
      stats: 'Market leaders use Top-of-Search Ads to fill vacancies in under 48 hours.'
    }
  }[type];

  return (
    <div className="bg-white min-h-screen pb-40 animate-fade-in relative overflow-x-hidden">
      {/* Background patterns */}
      <div className={`absolute top-0 left-0 w-full h-[600px] ${content.bgColor} opacity-40 pointer-events-none`}></div>
      <div className="absolute top-40 right-[-10%] w-64 h-64 bg-white/50 rounded-full blur-3xl opacity-30"></div>
      
      {/* Premium Header */}
      <header className="fixed top-0 max-w-md w-full bg-white/90 backdrop-blur-2xl px-6 py-5 z-[100] flex items-center justify-between border-b border-gray-100/50 shadow-sm">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-accent active:scale-90 transition-all shadow-sm">
          <span className="material-icons-round">arrow_back</span>
        </button>
        <span className="text-xl font-display font-black text-accent tracking-tight">{content.title}</span>
        <div className="w-10 h-10 flex items-center justify-center text-primary/40">
          <span className="material-icons-round">more_vert</span>
        </div>
      </header>

      <div className="pt-28 px-6 relative z-10 w-full overflow-x-hidden">
        {/* Animated Hero Section */}
        <div className="flex flex-col items-center mb-10 text-center animate-slide-up">
           <div className={`w-28 h-28 bg-gradient-to-tr ${content.color} rounded-[3.5rem] flex items-center justify-center text-white shadow-premium-lg mb-8 relative group overflow-hidden`}>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="material-icons-round text-6xl drop-shadow-2xl transform group-hover:rotate-12 transition-transform duration-500">{content.icon}</span>
           </div>
           
           <h1 className="text-4xl font-display font-black text-accent leading-tight mb-4">
              {content.title}
           </h1>
           <div className="flex items-center gap-2 mb-6 justify-center">
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full ${content.bgColor} ${content.textColor} shadow-sm border border-gray-100`}>
                Official Premium Service
              </span>
           </div>
           
           <p className="text-[15px] font-medium text-gray-600 leading-relaxed max-w-[320px] mx-auto">
              {content.hero}
           </p>
        </div>

        {/* Benefits Grid (Naukri Style) */}
        <div className="space-y-4 mb-12 w-full max-w-md mx-auto">
           <div className="flex items-end justify-between px-2 mb-2">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Key Benefits</h3>
              <span className="text-[10px] font-black text-primary flex items-center gap-1 group cursor-pointer uppercase tracking-tight">Explore More <span className="material-icons-round text-[12px] group-hover:translate-x-1 transition-transform">trending_flat</span></span>
           </div>

           {content.benefits.map((b, i) => (
             <div key={i} className="flex gap-5 p-6 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group animate-slide-up duration-500" style={{ animationDelay: `${i*100}ms` }}>
                <div className={`w-14 h-14 ${content.bgColor} ${content.textColor} rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                   <span className="material-icons-round text-2xl">{b.icon}</span>
                </div>
                <div className="flex-1">
                   <h4 className="text-sm font-bold text-accent mb-1 group-hover:text-primary transition-colors">{b.title}</h4>
                   <p className="text-[12px] text-gray-600 font-medium leading-relaxed">{b.desc}</p>
                </div>
             </div>
           ))}
        </div>

        {/* Trust Proof (World.in Reference) */}
        <div className="px-2 w-full max-w-md mx-auto mb-16">
          <div className="p-8 rounded-[3rem] border-2 border-dashed border-gray-100 text-center relative bg-white/50 backdrop-blur-sm group hover:border-primary/30 transition-all">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 bg-accent text-white text-[9px] font-black uppercase tracking-[0.4em] rounded-full shadow-lg">Trust Signal</div>
             <p className="text-[14px] font-bold text-gray-800 leading-relaxed italic mb-4">
                "{content.stats}"
             </p>
             <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map(s => <span key={s} className="material-icons-round text-amber-400 text-lg">star</span>)}
             </div>
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 max-w-md w-full p-6 bg-white/80 backdrop-blur-2xl border-t border-gray-100 z-[100] animate-slide-up-slow shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
         <button 
           onClick={onProceed}
           className={`w-full bg-gradient-to-tr ${content.color} text-white py-5 rounded-[2.2rem] font-display font-black text-sm uppercase tracking-widest shadow-premium-lg flex items-center justify-center gap-4 group active:scale-[0.97] transition-all overflow-hidden relative`}
         >
            <div className="absolute inset-0 bg-white/20 transform -skew-x-[30deg] translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            ACTIVATE NOW
            <span className="material-icons-round bg-white/10 p-1.5 rounded-full text-base">payments</span>
         </button>
         <p className="text-center mt-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
            Safe & Secure Checkout via TokenPay
         </p>
      </div>
    </div>
  );
};


