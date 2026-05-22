import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getStats } from '../utils/api';

const ITEMS = [
  { key: 'bus_routes',        label: 'Bus Routes',        icon: '🚌', color: 'text-mint' },
  { key: 'train_connections', label: 'Train Connections',  icon: '🚂', color: 'text-lavender' },
  { key: 'local_transport',   label: 'Local Transport',    icon: '🛺', color: 'text-gold' },
  { key: 'locations',         label: 'Locations',          icon: '📍', color: 'text-silver' },
  { key: 'active_alerts',     label: 'Active Alerts',      icon: '⚠️', color: 'text-gold' },
];

export default function StatsBar() {
  const [stats, setStats] = useState(null);
  useEffect(() => { getStats().then(setStats).catch(() => {}); }, []);
  if (!stats) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="flex flex-wrap gap-2 justify-center"
    >
      {ITEMS.map((item, i) => (
        <motion.div
          key={item.key}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-2 glass px-4 py-2 rounded-xl"
        >
          <span className="text-sm">{item.icon}</span>
          <div>
            <div className={`font-bold text-sm leading-none ${item.color}`}>{stats[item.key]}</div>
            <div className="text-silver/35 text-[11px] mt-0.5">{item.label}</div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
