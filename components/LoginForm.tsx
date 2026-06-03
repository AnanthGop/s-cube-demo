import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, User, ShieldCheck, ArrowRight, Hexagon } from 'lucide-react';

interface LoginFormProps {
  onLogin: (username: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      setIsSubmitting(true);
      // Simulate a small delay for a professional feel
      await new Promise(resolve => setTimeout(resolve, 800));
      onLogin(username);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-6 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden">
          <div className="p-10">
            <div className="flex flex-col items-center mb-10">
              <motion.div 
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.5 }}
                className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-brand-500/20"
              >
                <Hexagon className="text-white fill-white/10" size={32} />
              </motion.div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">S³ Portal</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-center font-bold text-[10px] uppercase tracking-[0.3em]">Enterprise Gateway</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-500 transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full pl-11 pr-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition dark:text-white font-bold text-sm"
                    placeholder="Username or Email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Key</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    className="w-full pl-11 pr-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition dark:text-white font-bold text-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">Remember me</span>
                </label>
                <a href="#" className="text-[10px] font-bold text-brand-600 hover:text-brand-500 uppercase tracking-wider transition-colors">Forgot key?</a>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-black py-4 px-6 rounded-2xl transition-all duration-300 shadow-xl shadow-brand-500/20 flex items-center justify-center gap-2 group overflow-hidden relative"
              >
                {isSubmitting ? (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <span className="relative z-10 uppercase tracking-widest text-xs">Authorize Access</span>
                    <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-brand-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </button>
            </form>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-800/50 px-10 py-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">End-to-End Encrypted Session</span>
          </div>
        </div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]"
        >
          © 2026 S³ Enterprise Solutions
        </motion.p>
      </motion.div>
    </div>
  );
};
