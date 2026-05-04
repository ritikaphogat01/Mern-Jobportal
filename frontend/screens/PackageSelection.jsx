import React, { useState, useEffect } from 'react';
import { RecruiterAuth } from './RecruiterAuth';

export const PackageSelection = ({ jobId, isBoosted, onBack, onNext }) => {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Coupon States
  const [coupons, setCoupons] = useState([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Fetch Plans
    fetch('/api/plans')
      .then(res => res.json())
      .then(data => {
        const recruiterPlans = data.filter((p) => p.role === 'EMPLOYER' || p.role === 'Recruiter');
        setPlans(recruiterPlans);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch Coupons
    fetch('/api/coupons')
      .then(res => res.json())
      .then(data => {
        const valid = data.filter((c) => 
          (c.role === 'BOTH' || c.role === 'EMPLOYER') &&
          (!c.validUntil || new Date(c.validUntil) > new Date()) &&
          (!c.usageLimit || c.usageCount < c.usageLimit)
        );
        setCoupons(valid);
      })
      .catch(console.error);
  }, []);

  const getPlanPrice = (plan) => {
    const base = plan.price || 0;
    return isBoosted ? (base + 1499) : base;
  };

  // Extract job post credits from plan data (admin sets via Credits > Job Posts field)
  const getPlanCredits = (plan) => {
    // Admin form saves as credits.jobPosts
    if (plan.credits) {
      if (typeof plan.credits.jobPosts === 'number' && plan.credits.jobPosts > 0) return plan.credits.jobPosts;
      if (typeof plan.credits.jobPosts === 'string') {
        const n = parseInt(plan.credits.jobPosts);
        if (!isNaN(n) && n > 0) return n;
      }
      // Also check .jobs (legacy)
      if (typeof plan.credits.jobs === 'number' && plan.credits.jobs > 0) return plan.credits.jobs;
      if (typeof plan.credits === 'number' && plan.credits > 0) return plan.credits;
    }
    // Fallback: scan features text for a number (e.g. "3 jobs post", "5 Job Posts")
    if (Array.isArray(plan.features)) {
      for (const f of plan.features) {
        const m = String(f).match(/(\d+)\s*(job|post)/i);
        if (m) return parseInt(m[1]);
      }
    }
    return 3; // default fallback
  };

  const handleCouponClick = () => {
    if (!selectedPlan) {
      alert('Please select a plan first to see applicable coupons.');
      return;
    }
    const plan = plans.find(p => p._id === selectedPlan || p.id === selectedPlan);
    if (plan && getPlanPrice(plan) <= 200) {
      alert('Coupons are not applicable on plans of ₹200 or less.');
      return;
    }
    setShowCouponModal(true);
  };

  const handleNext = () => {
    if (!selectedPlan) {
      alert('Please select a plan first.');
      return;
    }

    // NEW: Check if Recruiter is logged in
    const recruiterEmail = localStorage.getItem('recruiter_email');
    if (!recruiterEmail) {
      setShowAuth(true);
      return;
    }
    const plan = plans.find(p => p._id === selectedPlan || p.id === selectedPlan);
    const basePrice = getPlanPrice(plan);
    
    // Calculate final discount
    let discountAmount = 0;
    if (selectedCoupon && basePrice > 200) {
      discountAmount = selectedCoupon.discountType === 'PERCENT' 
        ? (basePrice * selectedCoupon.value / 100) 
        : selectedCoupon.value;
    }

    onNext({
      planId: selectedPlan,
      planName: `${plan?.name}${isBoosted ? ' + Elite Boost' : ''}`,
      amount: basePrice - discountAmount,
      isBoosted: isBoosted,
      couponCode: selectedCoupon?.code,
      discount: discountAmount,
      planCredits: getPlanCredits(plan)
    });
  };

  return (
    <div className="animate-fade-in bg-[#FAFBFF] min-h-full pb-32 flex flex-col overflow-hidden relative">
      <header className="px-6 py-8 flex items-center justify-between sticky top-0 bg-[#FAFBFF]/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-accent active:scale-90 transition-all border border-gray-100">
            <span className="material-icons-round">arrow_back</span>
          </button>
          <div>
            <h2 className="text-2xl font-display font-black text-accent">Select Package</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Step 2 of 2: Review & Pay</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="p-6">
          <div className="bg-primary/5 p-6 rounded-[2.5rem] border border-primary/10 mb-8 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <span className="material-icons-round">diamond</span>
            </div>
            <div>
              <h3 className="text-xs font-black text-accent uppercase tracking-wider">Premium Access</h3>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">Choose a package to publish your vacancy.</p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fetching Packages...</p>
            </div>
          ) : (
            <>
              <div className="flex gap-5 overflow-x-auto pb-8 snap-x no-scrollbar -mx-6 px-6">
                {plans.map((plan) => (
                  <div
                    key={plan._id || plan.id}
                    onClick={() => {
                      const id = plan._id || plan.id;
                      setSelectedPlan(id);
                      // Reset coupon if new plan is selected and it's too cheap
                      if (getPlanPrice(plan) <= 200) setSelectedCoupon(null);
                    }}
                    className={`flex-shrink-0 w-[300px] snap-center p-8 rounded-[3.5rem] border-2 transition-all duration-500 relative flex flex-col cursor-pointer ${selectedPlan === (plan._id || plan.id)
                        ? 'border-primary bg-white shadow-2xl shadow-primary/10 scale-105 z-10'
                        : 'border-transparent bg-white shadow-sm hover:border-gray-100'
                      }`}
                  >
                    <div className="mb-8 text-center pt-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{plan.name}</p>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-4xl font-display font-black text-accent">
                          ₹{getPlanPrice(plan)}
                        </span>
                      </div>
                      {isBoosted && (
                        <p className="text-[9px] font-black text-primary uppercase mt-1">INCL. ELITE BOOST (₹1499)</p>
                      )}
                    </div>

                    <div className="space-y-4 mb-10 flex-1 border-t border-gray-50 pt-8">
                      {plan.features.slice(0, 4).map((f, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                            <span className="material-icons-round text-emerald-500 text-[10px]">check</span>
                          </div>
                          <span className="text-xs font-bold text-gray-600 tracking-tight">{f}</span>
                        </div>
                      ))}
                    </div>

                    <div className={`mt-auto w-full h-12 rounded-2xl flex items-center justify-center gap-2 transition-all ${selectedPlan === (plan._id || plan.id)
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'bg-[#FAFBFF] text-gray-400'
                      }`}>
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {selectedPlan === (plan._id || plan.id) ? 'Selected Plan' : 'Select'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Button Section */}
              <div className="px-2 mt-4">
                <button 
                  onClick={handleCouponClick}
                  className={`w-full py-4 rounded-2xl border-2 border-dashed flex items-center justify-between px-6 transition-all active:scale-[0.98] ${
                    selectedCoupon ? 'border-emerald-500 bg-emerald-50' : 'border-primary/30 bg-primary/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`material-icons-round ${selectedCoupon ? 'text-emerald-500' : 'text-primary'}`}>
                      {selectedCoupon ? 'verified' : 'confirmation_number'}
                    </span>
                    <div className="text-left">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${selectedCoupon ? 'text-emerald-600' : 'text-primary'}`}>
                        {selectedCoupon ? 'Coupon Applied' : 'Have a Promo Code?'}
                      </p>
                      <p className="text-xs font-bold text-accent">
                        {selectedCoupon ? `${selectedCoupon.code} selected` : 'Click to see available offers'}
                      </p>
                    </div>
                  </div>
                  {selectedCoupon ? (
                    <span onClick={(e) => { e.stopPropagation(); setSelectedCoupon(null); }} className="material-icons-round text-gray-400 text-lg hover:text-red-500">cancel</span>
                  ) : (
                    <span className="material-icons-round text-primary/40">chevron_right</span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-xl border-t border-gray-100 p-8 flex flex-col items-center gap-6 safe-bottom fixed bottom-0 left-0 right-0 z-30 max-w-md mx-auto">
        {selectedCoupon && (
           <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <span className="material-icons-round text-emerald-500 text-xs">savings</span>
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">You saved extra ₹{
                selectedCoupon.discountType === 'PERCENT' 
                  ? Math.round(getPlanPrice(plans.find(p => p._id === selectedPlan || p.id === selectedPlan)) * selectedCoupon.value / 100) 
                  : selectedCoupon.value
              }!</p>
           </div>
        )}
        <button
          onClick={handleNext}
          disabled={!selectedPlan}
          className="w-full max-w-sm h-16 bg-primary text-white font-display font-black text-lg rounded-[2.2rem] shadow-premium shadow-primary/30 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 px-8"
        >
          <span className="material-icons-round">lock</span> {
            selectedCoupon 
              ? `Pay ₹${getPlanPrice(plans.find(p => p._id === selectedPlan || p.id === selectedPlan)) - (selectedCoupon.discountType === 'PERCENT' ? Math.round(getPlanPrice(plans.find(p => p._id === selectedPlan || p.id === selectedPlan)) * selectedCoupon.value / 100) : selectedCoupon.value)}`
              : 'Buy Now & Post'
          }
        </button>
        <div className="flex items-center gap-4">
          <span className="material-icons-round text-gray-300 text-sm">security</span>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Secure Checkout Verified</p>
        </div>
      </div>

      {/* Coupon Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-accent/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowCouponModal(false)}>
          <div className="bg-white w-full max-w-md rounded-t-[3rem] p-8 pb-12 animate-slide-up shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8"></div>
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-2xl font-display font-black text-accent">Available Coupons</h3>
               <button onClick={() => setShowCouponModal(false)} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center"><span className="material-icons-round text-gray-400">close</span></button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar py-2">
              {coupons.length === 0 ? (
                <div className="text-center py-12">
                   <span className="material-icons-round text-5xl text-gray-100 mb-4">sentiment_dissatisfied</span>
                   <p className="text-sm font-bold text-gray-400">No active coupons found.</p>
                </div>
              ) : (
                coupons.map(coupon => (
                  <button
                    key={coupon._id || coupon.id}
                    onClick={() => { setSelectedCoupon(coupon); setShowCouponModal(false); }}
                    className="w-full p-6 rounded-3xl border-2 border-gray-100 hover:border-primary/30 transition-all flex items-center justify-between text-left group"
                  >
                    <div>
                       <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-black text-primary uppercase tracking-widest">{coupon.code}</p>
                          <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Verified</span>
                       </div>
                       <p className="text-xl font-display font-black text-accent">
                          {coupon.discountType === 'PERCENT' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                       </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all transform scale-90 group-hover:scale-100">
                       <span className="material-icons-round">add</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* Recruiter Auth Overlay */}
      {showAuth && (
        <div className="fixed inset-0 z-[100] bg-white animate-slide-up h-full overflow-y-auto">
          <RecruiterAuth 
            onBack={() => setShowAuth(false)} 
            onSuccess={() => {
              setShowAuth(false);
              // Wait a bit for state to update then trigger next
              setTimeout(handleNext, 100);
            }} 
            pendingJobId={jobId}
          />
        </div>
      )}
    </div>
  );
};
