import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, RefreshCw, AlertTriangle } from 'lucide-react';
import { getAlerts } from '../utils/api';

const SEV = {
  high:   { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626' },
  medium: { bg: '#FFFBEB', border: '#FDE68A', text: '#D97706' },
  low:    { bg: '#F0FDF4', border: '#BBF7D0', text: '#16A34A' },
};

export default function LiveAlerts() {
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const d = await getAlerts();
      setAlerts([...(d.db_alerts || []), ...(d.weather_alerts || [])]);
    } catch { setAlerts([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  return (
    <div className="white-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #F3F4F6' }}>
        <div className="flex items-center gap-2">
          <Bell size={15} style={{ color: '#EF4444' }} />
          <span className="font-semibold text-sm" style={{ color: '#EF4444' }}>Live Alerts</span>
          {alerts.length > 0 && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: '#EF4444' }}>
              {alerts.length}
            </span>
          )}
        </div>
        <button onClick={fetch} disabled={loading}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">
          {alerts.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center py-6 text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: '#FEF2F2' }}>
                <Bell size={24} style={{ color: '#FCA5A5' }} />
              </div>
              <p className="font-semibold text-gray-700 text-sm mb-1">No active alerts</p>
              <p className="text-xs text-gray-400 leading-relaxed max-w-[200px]">
                You're all set! We'll notify you about important travel updates.
              </p>
            </motion.div>
          ) : (
            <motion.div key="list" className="space-y-2">
              {alerts.slice(0, 5).map((a, i) => {
                const s = SEV[a.severity] || SEV.medium;
                return (
                  <motion.div key={a.id || i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }} className="rounded-lg p-3"
                    style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={13} style={{ color: s.text, marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <p className="text-xs font-semibold" style={{ color: s.text }}>{a.title}</p>
                        {a.description && <p className="text-xs text-gray-500 mt-0.5">{a.description}</p>}
                        {a.district && (
                          <span className="inline-block mt-1 text-xs px-1.5 py-0.5 rounded-full bg-white/60 text-gray-500">
                            {a.district}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
