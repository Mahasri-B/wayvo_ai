import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiX, FiRefreshCw, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { getAlerts } from '../utils/api';

const SEV = {
  critical: { dot: 'bg-red-400',    text: 'text-red-300',    bg: 'bg-red-900/20 border-red-700/30' },
  high:     { dot: 'bg-orange-400', text: 'text-orange-300', bg: 'bg-orange-900/20 border-orange-700/30' },
  medium:   { dot: 'bg-gold',       text: 'text-gold',       bg: 'bg-gold/5 border-gold/20' },
  low:      { dot: 'bg-mint',       text: 'text-mint',       bg: 'bg-mint/5 border-mint/20' },
};
const TYPE_EMOJI = { landslide:'🏔️', flood:'🌊', fog:'🌫️', heavy_rain:'🌧️', road_closure:'🚧', rain:'🌦️', storm:'⛈️', strong_wind:'💨', safety:'🛡️', general:'ℹ️' };

export default function AlertsBanner() {
  const [alerts, setAlerts]       = useState([]);
  const [dismissed, setDismissed] = useState(new Set());
  const [loading, setLoading]     = useState(false);
  const [open, setOpen]           = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const d = await getAlerts();
      setAlerts([...(d.db_alerts || []), ...(d.weather_alerts || [])]);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetch(); const t = setInterval(fetch, 5 * 60 * 1000); return () => clearInterval(t); }, []);

  const visible = alerts.filter(a => !dismissed.has(a.id || a.title));
  if (!visible.length && !loading) return null;

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-lavender/10">
        <div className="flex items-center gap-2">
          <FiAlertTriangle className="text-gold text-sm" />
          <span className="text-white text-sm font-semibold">Live Alerts</span>
          {visible.length > 0 && (
            <span className="text-xs bg-gold/10 text-gold border border-gold/20 px-2 py-0.5 rounded-full">{visible.length}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetch} disabled={loading} className="text-silver/40 hover:text-lavender transition-colors" aria-label="Refresh">
            <FiRefreshCw className={`text-xs ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setOpen(!open)} className="text-silver/40 hover:text-lavender transition-colors text-xs">
            {open ? <FiChevronUp /> : <FiChevronDown />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
              {loading && !visible.length && (
                <div className="text-xs text-silver/30 text-center py-2">Checking alerts...</div>
              )}
              {visible.slice(0, 6).map((a, i) => {
                const cfg = SEV[a.severity] || SEV.medium;
                return (
                  <motion.div key={a.id || i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${cfg.bg}`}>
                    <span className="text-sm flex-shrink-0">{TYPE_EMOJI[a.type] || '⚠️'}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-semibold ${cfg.text} truncate`}>{a.title}</div>
                      {a.description && <div className="text-xs text-silver/40 mt-0.5 line-clamp-2">{a.description}</div>}
                      {a.district && <div className="text-[11px] text-silver/25 mt-0.5">{a.district}</div>}
                    </div>
                    <button onClick={() => setDismissed(p => new Set([...p, a.id || a.title]))}
                      className="text-silver/25 hover:text-silver/60 flex-shrink-0" aria-label="Dismiss">
                      <FiX className="text-xs" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
