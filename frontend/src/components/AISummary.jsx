import { motion } from 'framer-motion';
import { FiZap } from 'react-icons/fi';

export default function AISummary({ summary, from, to }) {
  if (!summary) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 border border-lavender/20"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-lavender to-mint flex items-center justify-center">
          <FiZap className="text-bg text-xs" />
        </div>
        <span className="text-white font-semibold text-sm">AI Route Summary</span>
        <span className="text-lavender/50 text-xs ml-1">Llama 3</span>
      </div>
      <div className="flex items-center gap-2 mb-3 text-xs">
        <span className="bg-card/60 border border-lavender/15 text-silver/70 px-2 py-1 rounded-lg">{from}</span>
        <span className="text-silver/30">→</span>
        <span className="bg-card/60 border border-lavender/15 text-silver/70 px-2 py-1 rounded-lg">{to}</span>
      </div>
      <p className="text-silver/80 text-sm leading-relaxed whitespace-pre-wrap">{summary}</p>
    </motion.div>
  );
}
