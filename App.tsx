
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoginForm } from './components/LoginForm';
import { AppShell } from './components/AppShell';
import { LandingPage } from './components/LandingPage';
import {
  DEFAULT_POST_LOGIN_NAV,
  NAV_LOCAL_KEY,
  NAV_SESSION_KEY,
  getPostLoginNavigation,
} from './src/appNavigation';

const SESSION_KEY = 's3_erp_session';

const readSession = () => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as {
      view?: 'landing' | 'login' | 'app';
      user?: string | null;
      initialModule?: string;
    };
  } catch {
    return null;
  }
};

const App: React.FC = () => {
  const session = readSession();
  const [view, setView] = useState<'landing' | 'login' | 'app'>(
    session?.view ?? 'landing',
  );
  const [user, setUser] = useState<string | null>(session?.user ?? null);
  const [initialModule, setInitialModule] = useState<string>(
    session?.initialModule ?? 'Admin',
  );

  const handleLogin = (username: string) => {
    const postLoginNav = getPostLoginNavigation();
    setUser(username);
    setInitialModule(postLoginNav.activeTab);
    setView('app');
    try {
      sessionStorage.removeItem(NAV_SESSION_KEY);
      localStorage.removeItem(NAV_LOCAL_KEY);
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          view: 'app',
          user: username,
          initialModule: postLoginNav.activeTab,
        }),
      );
    } catch {}
  };

  const handleLogout = () => {
    setUser(null);
    setView('landing');
    try {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(NAV_SESSION_KEY);
      localStorage.removeItem(NAV_LOCAL_KEY);
    } catch {}
  };

  const handleModuleClick = (moduleName: string) => {
    setInitialModule(moduleName);
    setView('login');
    try {
      sessionStorage.removeItem(NAV_SESSION_KEY);
      localStorage.removeItem(NAV_LOCAL_KEY);
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ view: 'login', user: null, initialModule: moduleName }),
      );
    } catch {}
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <LandingPage onLoginClick={() => setView('login')} onModuleClick={handleModuleClick} />
          </motion.div>
        )}
        {view === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4 }}
          >
            <LoginForm onLogin={handleLogin} />
          </motion.div>
        )}
        {view === 'app' && (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AppShell
              user={user}
              onLogout={handleLogout}
              initialTab={initialModule || DEFAULT_POST_LOGIN_NAV.activeTab}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
