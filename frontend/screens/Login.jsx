import React, { useState } from 'react';

export const Login = ({ onLogin }) => {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const resetForm = () => {
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
  };

  const handleAuth = async () => {
    setError('');
    setSuccess('');

    // Basic Validation
    if (!email.includes('@')) return setError('Enter a valid email address');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (mode === 'signup') {
      if (!name.trim()) return setError('Enter your full name');
      if (phone.length < 10) return setError('Enter a valid phone number');
    }

    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/login' : '/api/register';
      const body = mode === 'login' 
        ? { email, password, role: 'Job Seeker' }
        : { username: name, email, password, role: 'Job Seeker', phone };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(mode === 'signup' ? 'Account created! Logging in...' : 'Login successful! Redirecting...');
        
        // Save to memory/localStorage
        // Same logic for both login and register since they both return data.user
        localStorage.setItem('candidate_mobile', data.user.email);
        localStorage.setItem('candidate_name', data.user.username || data.user.name);
        localStorage.setItem('candidate_id', data.user._id || data.user.id);
        localStorage.setItem('candidate_phone', data.user.phone || '');

        // Notification hit
        fetch(API_URL + '/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userEmail: data.user.email,
            title: mode === 'signup' ? 'Welcome to Token! 🚀' : 'Success Login! 👋',
            message: mode === 'signup' 
              ? `Hi ${data.user.username || data.user.name}, your account is ready! Let's find you a great job.`
              : `Welcome back, ${data.user.username || data.user.name}! We're glad to see you again.`
          })
        }).catch(() => {});

        setTimeout(() => {
          onLogin();
        }, 1500);
      } else {
        setError(data.message || data.error || 'Authentication failed');
        setLoading(false);
      }
    } catch (err) {
      setError('Connection failed. Please check your internet.');
      setLoading(false);
    }
  };

  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const savedName = localStorage.getItem('candidate_name');
  const savedMobile = localStorage.getItem('candidate_mobile');
  const hasSession = !!savedMobile && !isLoggedOut;

  const handleSwitchAccount = () => {
    setIsLoggedOut(true);
    resetForm();
  };

  const handleContinue = () => {
    onLogin();
  };

  if (hasSession) {
    return (
      <div className="h-full w-full flex flex-col bg-white overflow-hidden">
        {/* Branding Header */}
        <div className="pt-12 pb-8 px-8 flex flex-col items-center">
          <div className="w-24 h-24 bg-[#FF0000] rounded-[32px] flex items-center justify-center mb-6 shadow-2xl shadow-red-100 animate-float">
            <span className="text-white font-display text-5xl font-black">t</span>
          </div>
          <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight leading-tight text-center">
            Welcome back,<br/>{savedName}!
          </h1>
          <p className="text-slate-400 font-medium text-sm mt-2">You're already signed in</p>
        </div>

        <div className="flex-1 px-8 flex flex-col items-center justify-center">
          <div className="w-full max-w-[280px] p-6 bg-slate-50 rounded-3xl flex flex-col items-center gap-4 animate-slide-up">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <span className="material-icons-round text-[#FF0000] text-3xl">account_circle</span>
            </div>
            <div className="text-center">
              <p className="text-slate-900 font-bold text-base">{savedName}</p>
              <p className="text-slate-400 font-medium text-xs">{savedMobile}</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-4">
          <button
            onClick={handleContinue}
            className="w-full h-16 bg-[#FF0000] text-white font-display font-black rounded-2xl shadow-xl shadow-red-100 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg"
          >
            Continue as {savedName?.split(' ')[0]}
            <span className="material-icons-round text-xl">arrow_forward</span>
          </button>

          <button
            onClick={handleSwitchAccount}
            className="w-full py-2 text-sm font-bold text-slate-400 hover:text-[#FF0000] transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-icons-round text-lg">swap_horiz</span>
            Not you? Switch account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-white overflow-hidden">
      {/* Branding Header - Reduced Padding */}
      <div className="pt-6 pb-4 px-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-[#FF0000] rounded-2xl flex items-center justify-center mb-3 shadow-xl shadow-red-100 animate-float">
          <span className="text-white font-display text-3xl font-black">t</span>
        </div>
        <h1 className="text-2xl font-display font-black text-slate-900 tracking-tight leading-tight">
          {mode === 'login' ? 'Welcome Back' : 'Join Token'}
        </h1>
        <p className="text-slate-400 font-medium text-xs mt-0.5">
          {mode === 'login' ? 'Sign in to your account' : 'Register to get started'}
        </p>
      </div>

      <div className="flex-1 px-8 py-2 overflow-y-auto no-scrollbar">
        <div className="space-y-3.5">
          {/* Mode Specific: Name */}
          {mode === 'signup' && (
            <div className="animate-slide-up">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 ml-1 block">Full Name</label>
              <div className="relative group">
                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#FF0000] transition-colors text-lg">person</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full h-12 pl-11 pr-4 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-[#FF0000] focus:ring-4 focus:ring-red-50 text-slate-900 font-semibold text-sm transition-all outline-none"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 ml-1 block">Email Address</label>
            <div className="relative group">
              <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#FF0000] transition-colors text-lg">alternate_email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                className="w-full h-12 pl-11 pr-4 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-[#FF0000] focus:ring-4 focus:ring-red-50 text-slate-900 font-semibold text-sm transition-all outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 ml-1 block">Password</label>
            <div className="relative group">
              <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#FF0000] transition-colors text-lg">lock</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 pl-11 pr-11 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-[#FF0000] focus:ring-4 focus:ring-red-50 text-slate-900 font-semibold text-sm transition-all outline-none"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
              >
                <span className="material-icons-round text-lg">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Mode Specific: Phone */}
          {mode === 'signup' && (
            <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 ml-1 block">Phone Number</label>
              <div className="relative group">
                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#FF0000] transition-colors text-lg">phone_iphone</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setPhone(val);
                  }}
                  placeholder="9876543210"
                  maxLength={10}
                  className="w-full h-12 pl-11 pr-4 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-[#FF0000] focus:ring-4 focus:ring-red-50 text-slate-900 font-semibold text-sm transition-all outline-none"
                />
              </div>
            </div>
          )}

          {/* Messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2.5 animate-shake">
              <span className="material-icons-round text-red-500 text-lg">error_outline</span>
              <p className="text-[11px] font-bold text-red-600 truncate">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2.5 animate-fade-in">
              <span className="material-icons-round text-emerald-500 text-lg">check_circle_outline</span>
              <p className="text-[11px] font-bold text-emerald-600 truncate">{success}</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-3 bg-gradient-to-t from-slate-50/50 to-white">
        <button
          onClick={handleAuth}
          disabled={loading}
          className="w-full h-14 bg-[#FF0000] text-white font-display font-black rounded-xl shadow-lg shadow-red-100 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2.5 text-base"
        >
          {loading ? (
            <span className="material-icons-round animate-spin">autorenew</span>
          ) : (
            <>
              {mode === 'login' ? 'Login' : 'Create Account'}
              <span className="material-icons-round text-lg">arrow_forward</span>
            </>
          )}
        </button>

        <button
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); resetForm(); }}
          className="w-full py-1 text-[13px] font-bold text-slate-400 hover:text-[#FF0000] transition-colors flex items-center justify-center gap-1"
        >
          {mode === 'login' ? (
            <>New here? <span className="text-[#FF0000]">Create Account</span></>
          ) : (
            <>Already a user? <span className="text-[#FF0000]">Sign In</span></>
          )}
        </button>

        <p className="text-[9px] text-center text-slate-300 font-medium px-4">
          By continuing, you agree to our <span className="underline">Terms</span> & <span className="underline">Privacy</span>
        </p>
      </div>
    </div>
  );
};


