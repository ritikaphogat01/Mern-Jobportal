import React, { useState, useEffect } from 'react';

export const PaymentMethod = ({ jobId, planId, planName, amount, isBoosted, couponCode, discount = 0, planCredits = 3, onBack, onComplete }) => {
  const [processing, setProcessing] = useState(false);
  const [paid, setPaid] = useState(false);
  
  // Total logic: the 'amount' prop now ALREADY represents the final discounted amount from PackageSelection
  const finalAmount = amount || 0;
  const originalAmount = finalAmount + discount;

  const handleProcessPayment = async () => {
    if (finalAmount < 0) return;
    setProcessing(true);

    try {
      const response = await fetch(API_URL + '/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: finalAmount, currency: 'INR' })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.details || 'Payment gateway error');
      }

      const order = await response.json();
      
      const handlerCallback = async (response) => {
        try {
          setProcessing(true);
          const verifyRes = await fetch(API_URL + '/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, jobId })
          });
          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            // Update Coupon Count if used
            if (couponCode) {
               try {
                 const cRes = await fetch(API_URL + '/api/coupons');
                 const coupons = await cRes.json();
                 const c = coupons.find((x) => x.code === couponCode);
                 if (c) {
                    await fetch(`/api/coupons/${c._id || c.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ...c, usageCount: (c.usageCount || 0) + 1 })
                    });
                 }
               } catch (e) {}
            }

            const email = (localStorage.getItem('recruiter_email') || '').trim().toLowerCase();
            const recruiterName = localStorage.getItem('recruiter_name') || 'Employer';

            if (planId === 'boost_only') {
              // Boost: update job to featured, use one credit
              await fetch(`/api/jobs/${jobId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'paid', isFeatured: true, paymentInfo: { method: 'razorpay_boost', paymentId: response.razorpay_payment_id, amount: finalAmount, planName: planName || 'Boost', paidAt: new Date().toISOString() } })
              }).catch(console.warn);
              // Count this boost as one credit used
              const boostUsed = parseInt(localStorage.getItem(`recruiter_used_${email}`) || '0');
              localStorage.setItem(`recruiter_used_${email}`, (boostUsed + 1).toString());
            } else {
              // New Plan: update job status and save subscription
              await fetch(`/api/jobs/${jobId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'paid', isFeatured: isBoosted || false, paymentInfo: { method: 'razorpay_package', paymentId: response.razorpay_payment_id, amount: finalAmount, planName: planName || 'Package', paidAt: new Date().toISOString() } })
              }).catch(console.warn);

              // Use planCredits from admin plan (passed from PackageSelection)
              const limit = planCredits && planCredits > 0 ? planCredits : 3;

              // Save per-email keys so credits are user-specific
              localStorage.setItem(`recruiter_limit_${email}`, limit.toString());
              localStorage.setItem(`recruiter_used_${email}`, '1'); // First post = this job

              // Also save backend subscription
              await fetch(API_URL + '/api/subscriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: email,
                  userName: recruiterName,
                  role: 'Recruiter',
                  planId: planId,
                  planName: planName,
                  startDate: new Date().toISOString(),
                  expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                  status: 'active',
                  creditsTotal: limit,
                  creditsUsed: 1
                })
              }).catch(console.warn);
            }

            await fetch(API_URL + '/api/transactions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userEmail: localStorage.getItem('recruiter_email') || '-',
                userName: localStorage.getItem('recruiter_name') || 'Employer',
                planName: `${planName}${couponCode ? ` (Coupon: ${couponCode})` : ''}`,
                amount: finalAmount,
                status: 'Success',
                method: 'Razorpay Gateway',
                date: new Date().toLocaleDateString('en-IN'),
                time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
              })
            }).catch(console.warn);

            setPaid(true);
          } else {
            alert("Verification failed");
          }
        } catch (err) {
          alert("Error verifying payment");
        } finally {
          setProcessing(false);
        }
      };

      if (order.id.startsWith('mock_')) {
        setTimeout(() => handlerCallback({ razorpay_order_id: order.id, razorpay_payment_id: 'pay_mock_' + Date.now(), razorpay_signature: 'mock' }), 1000);
        return;
      }

      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: "TokenJobs",
        description: `Plan checkout: ${planName}`,
        order_id: order.id,
        handler: handlerCallback,
        prefill: {
          name: localStorage.getItem('recruiter_name') || 'Employer',
          email: localStorage.getItem('recruiter_email') || 'hr@company.com',
          contact: localStorage.getItem('candidate_mobile') || '9999999999'
        },
        theme: { color: "#6366f1" },
        modal: { ondismiss: () => setProcessing(false) }
      };

      new window.Razorpay(options).open();

    } catch (err) {
      alert(`Payment failed: ${err.message || 'Unknown Error'}`);
      setProcessing(false);
    }
  };

  if (paid) {
    return (
      <div className="fixed inset-0 z-[200] bg-accent/90 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
        <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 text-center shadow-2xl animate-slide-up relative overflow-hidden">
          {/* Confetti-like decoration */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mb-8 animate-bounce transition-all border-4 border-emerald-100 shadow-lg shadow-emerald-500/20">
              <span className="material-icons-round text-emerald-500 text-5xl">verified</span>
            </div>
            
            <span className="px-5 py-2 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 border border-emerald-500/10">Payment Received</span>
            
            <h2 className="text-3xl font-display font-black text-accent mb-3 leading-tight">Elite Recruiter Verified!</h2>
            <p className="text-gray-500 font-medium text-sm leading-relaxed mb-10 px-2">Your payment was successful. Your job posting is now being prioritized for approval.</p>
            
            <button
              onClick={onComplete}
              className="w-full h-16 bg-gradient-to-r from-primary to-blue-600 text-white font-display font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/30 active:scale-95 transition-all text-center flex items-center justify-center gap-3"
            >
              Enter Dashboard <span className="material-icons-round">arrow_forward</span>
            </button>
            
            <div className="mt-8 flex items-center gap-2 group">
               <span className="material-icons-round text-gray-300 text-sm group-hover:text-primary transition-colors">receipt_long</span>
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest group-hover:text-accent transition-colors">Invoice generated in dashboard</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in bg-[#FAFBFF] min-h-screen flex flex-col overflow-hidden pb-10">
      <header className="px-6 py-8 flex items-center gap-4 sticky top-0 bg-[#FAFBFF]/80 backdrop-blur-xl z-20">
        <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-accent active:scale-90 transition-all border border-gray-100">
          <span className="material-icons-round">arrow_back</span>
        </button>
        <div>
          <h2 className="text-2xl font-display font-black text-accent">Review & Pay</h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Step 2: Payment Process</p>
        </div>
      </header>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto no-scrollbar">
        {/* Simplified Plan Card */}
        <div className="bg-accent text-white p-8 rounded-[2.5rem] shadow-premium relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Selected Plan</p>
            <h3 className="text-2xl font-display font-black mb-4">{planName}</h3>
            
            <div className="space-y-2 border-t border-white/10 pt-4">
              {discount > 0 && (
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-60">
                   <span>Original Price</span>
                   <span className="line-through">₹{originalAmount}</span>
                </div>
              )}
              {couponCode && (
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-400">
                   <span>Discount Applied ({couponCode})</span>
                   <span>-₹{Math.round(discount)}</span>
                </div>
              )}
              <div className="flex items-end justify-between pt-2">
                <div className="flex flex-col">
                   <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Final Amount</p>
                   <span className="text-4xl font-display font-black">₹{finalAmount}</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1.5">GST Incl.</span>
              </div>
            </div>
          </div>
          <span className="material-icons-round absolute -right-4 -bottom-4 text-white/5 text-[120px]">account_balance_wallet</span>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Confirm Method</p>
          <button
            onClick={handleProcessPayment}
            disabled={processing}
            className={`w-full group p-6 rounded-[2rem] border-2 transition-all flex items-center gap-6 active:scale-98 border-primary bg-white shadow-xl shadow-primary/5`}
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <span className="material-icons-round text-2xl">account_balance</span>
            </div>
            <div className="text-left">
              <h4 className="text-sm font-black text-accent uppercase tracking-wide">Pay ₹{finalAmount} Now</h4>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">UPI, Card, NetBanking</p>
            </div>
            <span className="material-icons-round ml-auto text-primary">verified_user</span>
          </button>
        </div>

        <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <span className="material-icons-round text-emerald-500 text-sm">security</span>
                <p className="text-[10px] font-black text-accent uppercase tracking-widest">Safe & Secure Payment</p>
            </div>
        </div>
      </div>

      {processing && (
        <div className="fixed inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};


