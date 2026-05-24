import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Bus, Train, Car, Navigation, Shield, RefreshCw, SlidersHorizontal } from 'lucide-react';

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
  const [from, setFrom]       = useState('');
  const [to, setTo]           = useState('');
  const [mode, setMode]       = useState('any');
  const [pref, setPref]       = useState('fastest');
  const [showFilters, setShowFilters] = useState(false);

  const swap = () => { const t = from; setFrom(to); setTo(t); };
  const go   = () => {
    if (!from.trim() || !to.trim()) return;
    onSearch?.({ from_location: from.trim(), to_location: to.trim(), mode, preference: pref });
  };

  return (
    <div className="white-card mx-2 md:mx-4 mt-2 md:mt-4 p-2 md:p-4">

      {/* ── MOBILE layout ── */}
      <div className="flex md:hidden items-center gap-1.5">
        {/* From + swap + To stacked in one column */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <input type="text" value={from} onChange={e => setFrom(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && go()}
            placeholder="From"
            className="w-full px-2.5 py-1.5 rounded-lg text-xs text-gray-800 placeholder-gray-400 outline-none"
            style={{ border: '1.5px solid #E5E7EB', background: '#F9FAFB' }}
            onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.background = '#fff'; }}
            onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
          />
          <input type="text" value={to} onChange={e => setTo(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && go()}
            placeholder="To"
            className="w-full px-2.5 py-1.5 rounded-lg text-xs text-gray-800 placeholder-gray-400 outline-none"
            style={{ border: '1.5px solid #E5E7EB', background: '#F9FAFB' }}
            onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.background = '#fff'; }}
            onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
          />
        </div>

        {/* Right buttons column */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          <motion.button whileTap={{ rotate: 180 }} onClick={swap}
            className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 transition-colors"
            style={{ border: '1.5px solid #E5E7EB' }}>
            <RefreshCw size={12} />
          </motion.button>
          <button onClick={() => setShowFilters(v => !v)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ border: `1.5px solid ${showFilters ? '#7C3AED' : '#E5E7EB'}`, color: showFilters ? '#7C3AED' : '#9CA3AF' }}>
            <SlidersHorizontal size={12} />
          </button>
        </div>

        {/* Search button */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={go}
          disabled={loading || !from.trim() || !to.trim()}
          className="btn-purple flex-shrink-0 flex items-center justify-center gap-1 px-3 py-2 text-xs disabled:opacity-50 self-stretch">
          {loading
            ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Search size={12} />
          }
          Go
        </motion.button>
      </div>

      {/* Mobile filters drawer */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}
            className="overflow-hidden md:hidden">
            <div className="flex flex-wrap gap-1.5 pt-2 mt-2" style={{ borderTop: '1px solid #F3F4F6' }}>
              <span className="text-xs font-semibold text-gray-500 w-full">Mode</span>
              {MODES.map(({ id, label, Icon }) => (
                <button key={id} onClick={() => setMode(id)}
                  className={`chip flex items-center gap-1 text-xs ${mode === id ? 'active' : ''}`}>
                  <Icon size={10} />{label}
                </button>
              ))}
              <span className="text-xs font-semibold text-gray-500 w-full mt-1">Preference</span>
              {PREFS.map(({ id, label, icon, Icon }) => (
                <button key={id} onClick={() => setPref(id)}
                  className={`chip flex items-center gap-1 text-xs ${pref === id ? 'active' : ''}`}>
                  {Icon ? <Icon size={10} /> : <span>{icon}</span>}
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DESKTOP layout ── */}
      <div className="hidden md:block">
        <div className="flex items-end gap-2">
          <div className="flex-1 min-w-0">
            <label className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1">
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#7C3AED' }} />From
            </label>
            <input type="text" value={from} onChange={e => setFrom(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && go()} placeholder="Starting location"
              className="w-full px-2.5 py-2 rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none transition-all"
              style={{ border: '1.5px solid #E5E7EB', background: '#F9FAFB' }}
              onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.background = '#fff'; }}
              onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
            />
          </div>
          <motion.button whileTap={{ rotate: 180 }} onClick={swap}
            className="mb-0.5 p-2 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
            style={{ border: '1.5px solid #E5E7EB' }}>
            <RefreshCw size={13} />
          </motion.button>
          <div className="flex-1 min-w-0">
            <label className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />To
            </label>
            <input type="text" value={to} onChange={e => setTo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && go()} placeholder="Destination"
              className="w-full px-2.5 py-2 rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none transition-all"
              style={{ border: '1.5px solid #E5E7EB', background: '#F9FAFB' }}
              onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.background = '#fff'; }}
              onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
            />
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={go}
            disabled={loading || !from.trim() || !to.trim()}
            className="btn-purple flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm mb-0.5 disabled:opacity-50">
            {loading
              ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Search size={13} />
            }
            Search
          </motion.button>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 pt-2" style={{ borderTop: '1px solid #F3F4F6' }}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-gray-500">Mode</span>
            {MODES.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setMode(id)}
                className={`chip flex items-center gap-1 text-xs ${mode === id ? 'active' : ''}`}>
                <Icon size={11} />{label}
              </button>
            ))}
          </div>
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-gray-500">Pref</span>
            {PREFS.map(({ id, label, icon, Icon }) => (
              <button key={id} onClick={() => setPref(id)}
                className={`chip flex items-center gap-1 text-xs ${pref === id ? 'active' : ''}`}>
                {Icon ? <Icon size={11} /> : <span className="text-xs">{icon}</span>}
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
