import React from 'react';

interface ProfilePageProps {
  user: string | null;
  themeColor: string;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, themeColor }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className={`bg-${themeColor} px-10 py-12 text-white flex items-center gap-8`}>
          <div className="w-24 h-24 rounded-3xl bg-white/20 border-4 border-white/20 flex items-center justify-center text-4xl font-black">
            {user?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase">{user || 'Administrator'}</h1>
            <p className="text-white/70 font-bold uppercase tracking-widest text-xs mt-2">Senior Executive User • S³ Portal Access</p>
          </div>
        </div>

        <div className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-8">
              <div className="border-l-4 border-indigo-500 pl-6">
                <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">Account Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Employee ID</label>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200">S³-USR-99210</div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Address</label>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{user?.toLowerCase() || 'admin'}@s3.org</div>
                  </div>
                </div>
              </div>

              <div className="border-l-4 border-emerald-500 pl-6">
                <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">Permissions</h3>
                <div className="flex flex-wrap gap-2">
                  {['Admin Access', 'Requisition Approver', 'Financial Controller', 'Report Export'].map(tag => (
                    <span key={tag} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 border border-slate-100 dark:border-slate-700">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Security Settings</h3>
               <button className="w-full py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition mb-4">
                 Change Password
               </button>
               <button className="w-full py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition">
                 Two-Factor Authentication
               </button>
               <p className="mt-8 text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center leading-relaxed">
                 Last login detected: 20/03/2024 14:22:10 from IP: 192.168.1.45
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};