
import React from 'react';

export const PolicyScreen = ({ type, onBack }) => {
  const meta = {
    privacy: { 
      title: 'Privacy Policy', 
      icon: 'shield', 
      accent: 'text-emerald-500', 
      bg: 'bg-emerald-50',
      date: 'March 2026',
      sections: [
        { title: 'Data Collection', content: 'We collect your name, mobile number, and professional details to provide seamless job matching. We do NOT share your mobile number without your explicit permission during application.' },
        { title: 'Recruiter Privacy', content: 'Company data and job post details are shared only with registered job seekers. We ensure all recruiter communications are secure within the Token ecosystem.' },
        { title: 'Security Measures', content: 'Your personal data is encrypted and stored in secure cloud servers. We perform regular audits to prevent unauthorized access.' }
      ]
    },
    terms: { 
      title: 'Terms & Conditions', 
      icon: 'description', 
      accent: 'text-blue-500', 
      bg: 'bg-blue-50',
      date: 'March 2026',
      sections: [
        { title: 'User Identity', content: 'Users must provide accurate information. Misrepresentation of qualifications or company identities will lead to immediate account suspension.' },
        { title: 'Fair Use', content: 'Spamming job posts or candidate lists is strictly prohibited. TokenJobs acts as a bridge; final hiring decisions rest between the parties involved.' },
        { title: 'IP Rights', content: 'All design elements, the TokenJobs logo, and proprietary matching algorithms are the exclusive property of Token Inc.' }
      ]
    },
    return: { 
      title: 'Return Policy', 
      icon: 'assignment_return', 
      accent: 'text-indigo-500', 
      bg: 'bg-indigo-50',
      date: 'March 2026',
      sections: [
        { title: 'Premium Credits', content: 'Unused job post credits can be returned or exchanged for Boost credits within 7 days of purchase, provided no job has been posted using them.' },
        { title: 'Service Interruption', content: 'If a technical glitch prevents your boosted post from appearing, we will restart your 7-day boost period at no extra cost.' }
      ]
    },
    refund: { 
      title: 'Refund Policy', 
      icon: 'payments', 
      accent: 'text-primary', 
      bg: 'bg-red-50',
      date: 'March 2026',
      sections: [
        { title: 'Instant Packages', content: 'Single-use "Visibility Boosts" and "Gold Verifications" are generally non-refundable once activated as the reach begins immediately.' },
        { title: 'Disputable Cases', content: 'If you are charged twice for the same package, the duplicate amount will be refunded to your original payment method within 5-7 business days.' },
        { title: 'Policy Violation', content: 'Refunds will NOT be provided for accounts terminated due to policy violations or fraudulent job postings.' }
      ]
    }
  }[type];

  return (
    <div className="animate-fade-in min-h-screen bg-[#F8FAFC] pb-24">
      <header className="bg-white/80 backdrop-blur-xl px-6 py-5 sticky top-0 z-50 flex items-center gap-5 border-b border-gray-100/50">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-accent active:scale-90 transition-all shadow-sm">
          <span className="material-icons-round">arrow_back</span>
        </button>
        <div className="text-xl font-display font-black text-accent">{meta.title}</div>
      </header>

      <div className="p-8">
        {/* Banner */}
        <div className={`${meta.bg} p-8 rounded-[3rem] flex flex-col items-center text-center mb-10 shadow-sm border border-white`}>
           <div className={`w-20 h-20 bg-white rounded-3xl flex items-center justify-center ${meta.accent} shadow-premium mb-4`}>
              <span className="material-icons-round text-4xl">{meta.icon}</span>
           </div>
           <h2 className="text-lg font-display font-black text-accent mb-1">{meta.title}</h2>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Effective Date: {meta.date}</p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 px-2">
           {meta.sections.map((s, i) => (
             <div key={i} className="relative pl-8 animate-slide-up duration-500" style={{ animationDelay: `${i*100}ms` }}>
                <div className={`absolute left-0 top-1 w-2 h-2 rounded-full ${meta.accent} shadow-lg shadow-current/20`}></div>
                <div className={`absolute left-[3px] top-4 w-[1px] h-full bg-gray-100 last:h-0`}></div>
                <h3 className="text-sm font-black text-accent uppercase tracking-tight mb-2">{s.title}</h3>
                <p className="text-[13px] font-medium text-gray-600 leading-relaxed mb-4">
                  {s.content}
                </p>
             </div>
           ))}
        </div>

        <div className="mt-16 p-8 bg-accent rounded-[2.5rem] text-white shadow-premium relative overflow-hidden group">
           <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/5 rounded-full blur-2xl transition-transform group-hover:scale-110"></div>
           <h4 className="font-display font-black text-lg mb-2 flex items-center gap-2">
             Need Clarification? <span className="material-icons-round text-primary animate-pulse">help_outline</span>
           </h4>
           <p className="text-[11px] text-white/70 font-semibold mb-6">Our legal team is here to assist you with any policy-related questions.</p>
           
           <div className="space-y-3">
             <a href="mailto:legal@tokenjobs.in" className="flex items-center gap-3 p-4 bg-white/10 rounded-2xl border border-white/10 hover:bg-white/20 transition-all">
                <span className="material-icons-round text-primary">email</span>
                <span className="text-[13px] font-bold">legal@tokenjobs.in</span>
             </a>
             <a href="tel:+917840037154" className="flex items-center gap-3 p-4 bg-white/10 rounded-2xl border border-white/10 hover:bg-white/20 transition-all">
                <span className="material-icons-round text-blue-400">call</span>
                <span className="text-[13px] font-bold">+91 78400 37154</span>
             </a>
           </div>
        </div>

        <p className="text-center mt-10 text-[9px] font-black text-gray-400 uppercase tracking-widest px-8">
           TokenJobs is a registered trademark of Token Inc. All Rights Reserved.
        </p>
      </div>
    </div>
  );
};


