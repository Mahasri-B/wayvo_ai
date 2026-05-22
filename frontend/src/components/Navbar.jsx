import { motion } from 'framer-motion';
import { FiMapPin, FiCpu } from 'react-icons/fi';

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -56, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-lavender/10"
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-lavender to-mint flex items-center justify-center">
            <FiMapPin className="text-bg text-xs" />
          </div>
          <span className="font-bold text-base text-white">PathFinder <span className="grad-lavender">TN</span></span>
          <span className="hidden sm:block text-[11px] text-lavender/70 bg-card/60 px-2 py-0.5 rounded-full border border-lavender/15">
            Tamil Nadu
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-mint/80">
            <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
            Live
          </span>
          <span className="flex items-center gap-1.5 text-xs text-lavender/70 bg-card/50 px-3 py-1.5 rounded-full border border-lavender/15">
            <FiCpu className="text-lavender text-xs" />
            Llama 3
          </span>
        </div>
      </div>
    </motion.nav>
  );
}
