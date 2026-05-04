
import React, { useState } from 'react';

export const RecruiterAuth = ({ onBack, onSuccess, pendingJobId }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    password: '',
    mobile: ''
  });
  const [loading, setLoading] = useState(false);

  // Sync with first page login email
  React.useEffect(() => {
    const candidateEmail = localStorage.getItem('candidate_mobile');
    if (candidateEmail && candidateEmail.includes('@gmail.com')) {
      setForm(prev => ({ ...prev, email: candidateEmail }));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!isLogin) {
        // Sign up user first
        const regRes = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: form.name,
            email: form.email,
            password: form.password,
            role: 'Recruiter',
            phone: form.mobile
          })
        });

        if (!regRes.ok) {
          const errData = await regRes.json();
          alert(errData.message || 'This email is already registered. Please login.');
          setLoading(false);
          return;
        }

        // Create company record in MongoDB backend when recruiter signs up
        await fetch('/api/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.company,
            email: form.email,
            industry: 'General',
            activeJobs: 0
          })
        }).catch(console.warn);

        // Welcome Notification for Recruiter
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: form.email,
            title: 'Welcome to Token Recruiter! 🚀',
            message: `Hello ${form.name || 'Recruiter'}, thank you for choosing Token. You can now post jobs and manage applicants.`
          })
        }).catch(console.warn);
      } else {
        // Login user
        const loginRes = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            role: 'Recruiter'
          })
        });

        if (!loginRes.ok) {
          const errData = await loginRes.json();
          alert(errData.message || 'Login failed.');
          setLoading(false);
          return;
        }
      }

      // If they just posted a job as an anonymous user, link it to this new/logged-in email!
      if (pendingJobId) {
        await fetch(`/api/jobs/${pendingJobId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recruiterEmail: form.email })
        }).catch(console.warn);
      }

      // Complete login/signup process
      setTimeout(() => {
        setLoading(false);
        localStorage.setItem('recruiter_email', form.email);
        localStorage.setItem('recruiter_name', form.name || form.email.split('@')[0]);
        localStorage.setItem('recruiter_company', form.company || 'Enterprise Partner');
        if (form.mobile) localStorage.setItem('recruiter_mobile', form.mobile);
        onSuccess();
      }, 500);
    } catch (error) {
      console.error('Auth error:', error);
      alert('Authentication error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in bg-white min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <header className="text-center mb-12">
          <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
            <span className="material-icons-round text-primary text-4xl">business_center</span>
          </div>
          <h2 className="text-3xl font-display font-black text-accent mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-500 font-medium text-sm">Recruiter Portal Access</p>
        </header>

        <div className="bg-gray-50 p-2 rounded-2xl mb-8 flex">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${isLogin ? 'bg-white text-accent shadow-premium' : 'text-gray-400'}`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${!isLogin ? 'bg-white text-accent shadow-premium' : 'text-gray-400'}`}
          >
            Signup
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full h-14 px-6 bg-gray-50 border-transparent rounded-2xl focus:ring-2 focus:ring-primary/20 font-bold transition-all"
                  value={form.name}
                  autoComplete="off"
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="Acme Inc"
                  className="w-full h-14 px-6 bg-gray-50 border-transparent rounded-2xl focus:ring-2 focus:ring-primary/20 font-bold transition-all"
                  value={form.company}
                  onChange={e => setForm({ ...form, company: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Mobile Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  className="w-full h-14 px-6 bg-gray-50 border-transparent rounded-2xl focus:ring-2 focus:ring-primary/20 font-bold transition-all"
                  value={form.mobile}
                  autoComplete="tel"
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val.length <= 10) setForm({ ...form, mobile: val });
                  }}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Enterprise Email</label>
            <input
              type="email"
              required
              placeholder="hr@company.com"
              className="w-full h-14 px-6 bg-gray-50 border-transparent rounded-2xl focus:ring-2 focus:ring-primary/20 font-bold transition-all"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full h-14 px-6 bg-gray-50 border-transparent rounded-2xl focus:ring-2 focus:ring-primary/20 font-bold transition-all"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-16 bg-accent text-white rounded-2xl font-display font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 mt-8"
          >
            {loading ? (
              <span className="material-icons-round animate-spin">sync</span>
            ) : (
              isLogin ? 'Sign In' : 'Register Now'
            )}
          </button>
        </form>

        <button
          onClick={onBack}
          className="w-full mt-6 py-4 text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
        >
          <span className="material-icons-round text-sm">arrow_back</span>
          Back to Portal
        </button>
      </div>
    </div>
  );
};
