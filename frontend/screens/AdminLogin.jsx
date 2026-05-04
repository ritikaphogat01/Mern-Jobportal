
import React, { useState } from 'react';

export const AdminLogin = ({ onLoginSuccess, onBack }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Local fallback for demo credentials to allow work when server is offline
    if (userId === 'admin' && password === 'token_admin_2025') {
      setTimeout(() => {
        setIsLoading(false);
        localStorage.setItem('admin_authenticated', 'true');
        onLoginSuccess();
      }, 500);
      return;
    }

    // call backend API to validate credentials for other users or real DB
    fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: userId, password })
    })
      .then(async (resp) => {
        const data = await resp.json();
        if (resp.ok && data.success) {
          localStorage.setItem('admin_authenticated', 'true');
          onLoginSuccess();
        } else {
          setError(data.message || 'Invalid credentials');
        }
      })
      .catch(() => setError('Unable to reach server'))
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="min-h-screen bg-[#E0F2FE] flex items-center justify-center p-6">
      {/* Redesigned Card to match Anil Pharmacy layout style but with Token branding */}
      <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-8 animate-fade-in border border-white">
        
        {/* Header Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full border-2 border-[#2563EB] flex items-center justify-center">
              <span className="material-icons-round text-[#2563EB] text-2xl">access_time</span>
            </div>
            <h1 className="text-2xl font-display font-black tracking-tight flex items-center">
              <span className="text-accent">Token</span>
              <span className="text-[#2563EB] ml-1">Jobs</span>
            </h1>
          </div>
          <p className="text-gray-700 text-[10px] font-medium">
            Inventory Management System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Normal Styled User ID Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-700 ml-1">User ID</label>
            <input 
              type="text" 
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="admin"
              className="w-full bg-[#3F3F3F] border-none rounded-xl py-3.5 px-5 text-white placeholder:text-white/70 focus:ring-4 focus:ring-blue-500/20 transition-all font-bold text-sm shadow-inner"
              required
            />
          </div>

          {/* Normal Styled Password Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-700 ml-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              className="w-full bg-[#3F3F3F] border-none rounded-xl py-3.5 px-5 text-white placeholder:text-white/70 focus:ring-4 focus:ring-blue-500/20 transition-all font-bold text-sm shadow-inner"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-[10px] font-bold text-center animate-slide-up">{error}</p>
          )}

          {/* Blue Gradient Sign In Button */}
          <button 
            disabled={isLoading}
            type="submit"
            className="w-full h-14 bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white font-bold text-sm rounded-full shadow-lg shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
          >
            {isLoading ? (
              <span className="material-icons-round animate-spin">refresh</span>
            ) : (
              'Sign in'
            )}
          </button>
        </form>
        <div className="mt-8 pt-6 border-t border-gray-100">
           <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
              <div className="text-left">
                 <p className="text-gray-700 text-[8px] font-black uppercase">Demo User</p>
                 <p className="text-accent text-[11px] font-bold font-mono">admin</p>
              </div>
              <div className="text-right">
                 <p className="text-gray-700 text-[8px] font-black uppercase">Demo Pass</p>
                 <p className="text-accent text-[11px] font-bold font-mono">token_admin_2025</p>
              </div>
           </div>
        </div>

        <button 
          onClick={onBack}
          className="mt-6 w-full text-center text-gray-600 text-[10px] font-black uppercase tracking-widest hover:text-[#2563EB] transition-colors"
        >
          Back to Portal
        </button>
      </div>
    </div>
  );
};
