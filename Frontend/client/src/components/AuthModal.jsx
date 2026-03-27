import React, { useState } from 'react';

export default function AuthModal({ onClose, onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin ? { email: formData.email, password: formData.password } : formData;

    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Authentication failed');

      localStorage.setItem('et_token', data.token);
      onLoginSuccess(data.user); // Passes user data back up to App.jsx
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in transition-all">
      <div className="w-full max-w-md bg-[#111] border border-gray-800 rounded-3xl shadow-2xl p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#FF5000]"></div>

        <h3 className="text-3xl font-serif font-bold text-white mb-2 text-center">
          {isLogin ? 'Welcome Back' : 'Create Your Profile'}
        </h3>
        <p className="text-gray-400 text-sm text-center mb-10 leading-relaxed">
          {isLogin ? 'Sign in to access your ET Concierge' : 'Join ET to unlock your dynamic financial ecosystem'}
        </p>

        {error && <div className="mb-6 p-4 bg-red-950/50 border border-red-500 text-red-200 rounded-xl text-sm text-center font-medium shadow-inner">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">Full Name</label>
              <input type="text" required className="w-full bg-[#050505] border border-gray-700 text-white rounded-xl p-3.5 focus:border-[#FF5000] focus:ring-1 focus:ring-[#FF5000] transition-colors shadow-inner" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">Email Address</label>
            <input type="email" required className="w-full bg-[#050505] border border-gray-700 text-white rounded-xl p-3.5 focus:border-[#FF5000] focus:ring-1 focus:ring-[#FF5000] transition-colors shadow-inner" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">Password</label>
            <input type="password" required className="w-full bg-[#050505] border border-gray-700 text-white rounded-xl p-3.5 focus:border-[#FF5000] focus:ring-1 focus:ring-[#FF5000] transition-colors shadow-inner" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-[#FF5000] hover:bg-[#ff6a20] text-white font-bold py-4 rounded-xl transition-colors mt-6 disabled:opacity-50 shadow-lg">
            {isLoading ? 'Authenticating...' : (isLogin ? 'Sign In' : 'Begin 3-Minute Profiling')}
          </button>
        </form>

        <div className="mt-10 text-center">
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-sm text-gray-400 hover:text-white transition-colors font-medium">
            {isLogin ? "New to ET? Create an account" : "Already have an account? Sign in"}
          </button>
        </div>
        
        <button onClick={onClose} className="mt-6 w-full text-xs text-gray-600 hover:text-[#FF5000] uppercase tracking-[0.2em] font-bold transition-colors">
          ← Back to Home
        </button>
      </div>
    </div>
  );
}