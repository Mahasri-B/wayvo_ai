import { useEffect, useState } from 'react';
import { Bus, Train, MapPin } from 'lucide-react';
import { getStats } from '../utils/api';

const DEFS = [
  { key: 'bus_routes',        label: 'Bus Routes',        Icon: Bus,        iconColor: '#3B82F6', bg: '#EFF6FF' },
  { key: 'train_connections', label: 'Train Connections',  Icon: Train,      iconColor: '#F97316', bg: '#FFF7ED' },
  { key: 'locations',         label: 'Hill Stations',      Icon: MapPin,     iconColor: '#EF4444', bg: '#FEF2F2' },
];

export default function StatsRow() {
  const [stats, setStats] = useState({});
  useEffect(() => { getStats().then(setStats).catch(() => {}); }, []);

  return (
    <div className="flex gap-3 mx-4 mt-3">
      {DEFS.map(({ key, label, Icon, iconColor, bg }) => (
        <div key={key} className="flex items-center gap-3 px-4 py-3 rounded-xl flex-1 min-w-0"
          style={{ background: '#fff', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
            <Icon size={18} style={{ color: iconColor }} />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xl text-gray-900 leading-tight">{stats[key] ?? 0}</div>
            <div className="text-xs text-gray-500 truncate">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
