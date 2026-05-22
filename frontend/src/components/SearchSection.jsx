import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Bus, Train, Car, Navigation, Shield, RefreshCw } from 'lucide-react';

const MODES = [
  { id: 'any',   label: 'Any',   Icon: Navigation },
  { id: 'bus',   label: 'Bus',   Icon: Bus },
  { id: 'train', label: 'Train', Icon: Train },
  { id: 'car',   label: 'Car',   Icon: Car },
  { id: 'local', label: 'Local', Icon: MapPin },
];
const PREFS = [
  { id: 'fastest',  label: 'Fastest',  icon: '⚡' },
  { id: 'cheapest', label: 'Cheapest', icon: '₹' },
  { id: 'scenic',   label: 'Scenic',   icon: '~' },
  { id: 'safest',   label: 'Safest',   Icon: Shield },
];

export default function SearchSection({ onSearch, loading }) {
  const [from, setFrom] = useState('');
  const [to, setTo]     = useState('');
  const [mode, setMode] = useState('any');
  const [pref, setPref] = useState('fastest');

  const swap = () => { const t = from; setFrom(to); setTo(t); };
  const go   = () => {
    if (!from.trim() || !to.trim()) return;
    onSearch?.({ from_location: from.trim(), to_location: to.trim(), mode, preference: pref });
  };

  return (
    <div className="white-card mx-4 mt-4 p-4">
      {/* Row 1 */}
      <div className="flex items-end gap-2">
        {/* From */}
        <div className="flex-1 min-w-0">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#7C3AED' }} />
            From
          </label>
          <input type="text" value={from} onChange={e => setFrom(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && go()}
            placeholder="Enter starting location"
            className="w-full px-3 py-2.5 rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none transition-all"
            style={{ border: '1.5px solid #E5E7EB', background: '#F9FAFB' }}
            onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.background = '#fff'; }}
            onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
          />
        </div>

        {/* Swap */}
        <motion.button whileTap={{ rotate: 180 }} onClick={swap}
          className="flex-shrink-0 mb-0.5 p-2.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
          style={{ border: '1.5px solid #E5E7EB' }}>
          <RefreshCw size={15} />
        </motion.button>

        {/* To */}
        <div className="flex-1 min-w-0">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            To
          </label>
          <input type="text" value={to} onChange={e => setTo(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && go()}
            placeholder="Enter destination"
            className="w-full px-3 py-2.5 rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none transition-all"
            style={{ border: '1.5px solid #E5E7EB', background: '#F9FAFB' }}
            onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.background = '#fff'; }}
            onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
          />
        </div>

        {/* Search button */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={go}
          disabled={loading || !from.trim() || !to.trim()}
          className="btn-purple flex-shrink-0 flex items-center gap-2 px-5 py-2.5 text-sm mb-0.5 disabled:opacity-50">
          {loading
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Search size={14} />
          }
          Search Routes
        </motion.button>
      </div>

      {/* Row 2 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 pt-3" style={{ borderTop: '1px solid #F3F4F6' }}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-500">Travel Mode</span>
          {MODES.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setMode(id)}
              className={`chip flex items-center gap-1.5 ${mode === id ? 'active' : ''}`}>
              <Icon size={12} />{label}
            </button>
          ))}
        </div>
        <div className="hidden sm:block w-px h-5 bg-gray-200" />
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-500">Preference</span>
          {PREFS.map(({ id, label, icon, Icon }) => (
            <button key={id} onClick={() => setPref(id)}
              className={`chip flex items-center gap-1.5 ${pref === id ? 'active' : ''}`}>
              {Icon ? <Icon size={12} /> : <span className="text-xs">{icon}</span>}
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
