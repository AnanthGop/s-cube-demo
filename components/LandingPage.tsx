import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CreditCard,
  BookOpen,
  Gift,
  TrendingUp,
  Users,
  ScrollText,
  BarChart3,
  Scale,
  Bot,
  Building2,
  ShoppingBag,
  Sun,
  Moon,
  ArrowRight,
  Hexagon,
} from "lucide-react";

interface LandingPageProps {
  onLoginClick: () => void;
  onModuleClick: (module: string) => void;
}

const MODULES = [
  {
    id: "budget",
    label: "Budget",
    icon: BarChart3,
    theme: "cyan",
    description: "Allocation & Tracking",
  },
  {
    id: "expenses",
    label: "Expenses + Payments",
    icon: CreditCard,
    theme: "fuchsia",
    target: "Expenses + Payments",
    description: "Requisitions & Vouchers",
  },
  {
    id: "accounting",
    label: "Accounting",
    icon: BookOpen,
    theme: "blue",
    target: "Accounting",
    description: "Ledger & Books",
  },
  {
    id: "donations",
    label: "Donation Management",
    icon: Gift,
    theme: "emerald",
    description: "Grants & Contributions",
  },
  {
    id: "investments",
    label: "Investment Module",
    icon: TrendingUp,
    theme: "amber",
    description: "Fixed Deposits & MF",
  },
  {
    id: "beneficiaries",
    label: "Beneficiaries",
    icon: Users,
    theme: "indigo",
    description: "Impact & Tracking",
  },
  {
    id: "grants",
    label: "Grants",
    icon: ScrollText,
    theme: "rose",
    description: "Proposals & Tranches",
  },
  {
    id: "reporting",
    label: "Reporting",
    icon: LayoutDashboard,
    theme: "violet",
    description: "MIS & Statutory",
  },
  {
    id: "compliance",
    label: "Compliance",
    icon: Scale,
    theme: "sky",
    description: "Tax & FCRA",
  },
  {
    id: "assets",
    label: "Fixed Assets",
    icon: Building2,
    theme: "lime",
    description: "Asset Register",
  },
  {
    id: "procurement",
    label: "Procurement",
    icon: ShoppingBag,
    theme: "orange",
    description: "PO to Pay",
  },
];

const THEME_STYLES: Record<string, string> = {
  cyan: "from-cyan-500 to-blue-500",
  fuchsia: "from-fuchsia-500 to-purple-500",
  emerald: "from-emerald-500 to-teal-500",
  amber: "from-amber-500 to-orange-500",
  rose: "from-rose-500 to-red-500",
  violet: "from-violet-500 to-indigo-500",
  sky: "from-sky-500 to-blue-500",
  pink: "from-pink-500 to-rose-500",
  lime: "from-lime-500 to-green-500",
  orange: "from-orange-500 to-red-500",
  indigo: "from-indigo-500 to-violet-500",
  blue: "from-blue-500 to-indigo-500",
};

export const LandingPage: React.FC<LandingPageProps> = ({
  onLoginClick,
  onModuleClick,
}) => {
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const radiusX = 520;
  const radiusY = 340;

  return (
    <div
      className={`relative min-h-screen overflow-hidden flex flex-col items-center justify-center font-sans transition-colors duration-700 ${isDarkMode ? "bg-[#0a0a0c] text-white" : "bg-slate-50 text-slate-900"}`}>
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ${isDarkMode ? "opacity-100" : "opacity-0"}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-900/20 via-slate-950 to-slate-950"></div>
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-brand-600/20 rounded-full blur-[150px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
            className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px]"
          />
        </div>

        <div
          className={`absolute inset-0 transition-opacity duration-1000 ${isDarkMode ? "opacity-0" : "opacity-100"}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white"></div>
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-brand-100/50 rounded-full blur-[100px]"></div>
        </div>

        {/* Grid Overlay */}
        <div
          className={`absolute inset-0 bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] ${
            isDarkMode ? "bg-grid-white/[0.02]" : "bg-grid-black/[0.02]"
          }`}
          style={{
            backgroundImage: `radial-gradient(${isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} 1px, transparent 0)`,
          }}></div>
      </div>

      {/* Header */}
      <header className="absolute top-0 w-full px-8 py-6 flex justify-between items-center z-50">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-3">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <Hexagon
              className={`absolute inset-0 w-full h-full ${isDarkMode ? "text-brand-500" : "text-brand-600"} fill-current opacity-20`}
            />
            <span className="relative font-black text-lg tracking-tighter">
              S³
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter uppercase leading-none">
              S³ Enterprise
            </span>
            <span className="text-[9px] font-bold text-brand-500 uppercase tracking-[0.3em]">
              Next-Gen ERP
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-4">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2.5 rounded-full transition-all ${isDarkMode ? "bg-slate-800 text-yellow-400 hover:bg-slate-700" : "bg-white text-slate-600 shadow-sm hover:bg-slate-50 border border-slate-200"}`}>
            {isDarkMode ?
              <Sun size={18} />
            : <Moon size={18} />}
          </button>

          <button
            onClick={onLoginClick}
            className="group relative px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest overflow-hidden transition-all bg-brand-600 text-white shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40">
            <span className="relative z-10 flex items-center gap-2">
              Portal Access{" "}
              <ArrowRight
                size={14}
                className="group-hover:translate-x-1 transition-transform"
              />
            </span>
          </button>
        </motion.div>
      </header>

      {/* Orbit System */}
      <div className="relative w-full h-full flex items-center justify-center z-10 -translate-y-12 scale-[0.45] sm:scale-[0.55] md:scale-[0.65] lg:scale-[0.75] xl:scale-[0.85] transition-transform duration-700">
        <div className="relative w-[1300px] h-[800px] flex items-center justify-center">
          {/* Central Hub */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-20">
            <div
              className={`w-64 h-64 rounded-full flex flex-col items-center justify-center border-2 backdrop-blur-xl shadow-2xl transition-colors duration-500 ${
                isDarkMode ?
                  "bg-slate-900/80 border-slate-700 shadow-brand-500/10"
                : "bg-white/80 border-brand-100 shadow-brand-500/5"
              }`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-20px] rounded-full border border-dashed border-brand-500/30"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-40px] rounded-full border border-brand-500/10"
              />

              <Hexagon
                size={48}
                className="text-brand-500 mb-4 fill-brand-500/10"
              />
              <h1 className="text-4xl font-black tracking-tighter mb-1 uppercase">
                S³ CORE
              </h1>
              <div className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-500">
                System Hub
              </div>

              <div className="flex gap-1.5 mt-6">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.4,
                    }}
                    className="w-1.5 h-1.5 rounded-full bg-brand-500"
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Modules */}
          {MODULES.map((mod, idx) => {
            const angle = (idx / MODULES.length) * Math.PI * 2;
            const x = Math.cos(angle) * radiusX;
            const y = Math.sin(angle) * radiusY;
            const isHovered = hoveredModule === mod.id;

            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x,
                  y,
                }}
                transition={{
                  delay: idx * 0.05,
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                }}
                className="absolute">
                <motion.button
                  onMouseEnter={() => setHoveredModule(mod.id)}
                  onMouseLeave={() => setHoveredModule(null)}
                  onClick={() => onModuleClick(mod.target || "Admin")}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className={`group relative w-52 p-4 rounded-2xl border backdrop-blur-md transition-all duration-300 text-left ${
                    isDarkMode ?
                      "bg-slate-900/40 border-slate-800 hover:bg-slate-900/80 hover:border-brand-500/50"
                    : "bg-white/40 border-slate-200 hover:bg-white hover:border-brand-500/50 shadow-sm"
                  }`}>
                  <div
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${THEME_STYLES[mod.theme]} opacity-0 group-hover:opacity-5 transition-opacity`}
                  />

                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl bg-gradient-to-br ${THEME_STYLES[mod.theme]} text-white shadow-lg`}>
                      <mod.icon size={20} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-tight mb-0.5">
                        {mod.label}
                      </h3>
                      <p
                        className={`text-[10px] font-medium leading-tight ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                        {mod.description}
                      </p>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute -top-1 -right-1 w-3 h-3 bg-brand-500 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                      />
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            );
          })}

          {/* Connection Lines (SVG) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            {MODULES.map((mod, idx) => {
              const angle = (idx / MODULES.length) * Math.PI * 2;
              const x2 = 650 + Math.cos(angle) * radiusX;
              const y2 = 400 + Math.sin(angle) * radiusY;
              const isHovered = hoveredModule === mod.id;

              return (
                <motion.line
                  key={`line-${mod.id}`}
                  x1="650"
                  y1="400"
                  x2={x2}
                  y2={y2}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{
                    pathLength: 1,
                    opacity: isHovered ? 0.4 : 0.1,
                    stroke:
                      isHovered ? "#8b5cf6"
                      : isDarkMode ? "#ffffff"
                      : "#000000",
                  }}
                  transition={{ duration: 1 }}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-4 w-full px-8 z-20">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-2xl mx-auto">
          <div
            className={`p-4 rounded-2xl border backdrop-blur-md text-center ${
              isDarkMode ?
                "bg-slate-900/50 border-slate-800"
              : "bg-white/50 border-slate-200"
            }`}>
            <span className="text-brand-500 font-black text-[10px] uppercase tracking-[0.4em] block mb-2">
              S³ Integration Protocol
            </span>
            <p
              className={`text-xs font-medium italic ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
              "Modular architecture designed for seamless enterprise integration
              and scalability."
            </p>
            <p
              className={`text-xs font-medium italic ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
              Seamless Integration with Third-Party Tools: 
            </p>
          </div>
        </motion.div>
      </footer>
    </div>
  );
};
