import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMapPin, FiSearch, FiRefreshCw, FiZap, FiDollarSign, FiSun, FiShield } from 'react-icons/fi';
import { searchLocation } from '../utils/api';

const MODES = [
  { id: 'any',   label: 'Any' },
  { id: 'train', label: 'Train' },
  { id: 'bus',   label: 'Bus' },
  { id: 'car',   label: 'Car' },
  { id: 'local', label: 'Local' },
];

const PREFS = [
  { id: 'fastest',  label: 'Fastest',  icon: <FiZap /> },
  { id: 'cheapest', label: 'Cheapest', icon: <FiDollarSign /> },
  { id: 'scenic',   label: 'Scenic',   icon: <FiSun /> },
  { id: 'safest',   label: 'Safest',   icon: <FiShield /> },
];

function LocationInput({ value, onChange, placeholder, dotColor }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const timer = useRef(null);

  const handleChange = (e) => {
    const v = e.target.value;
    onChange(v);
    clearTimeout(timer.current);
    if (v.length < 2) { setSuggestions([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      try {
        const res = await searchLocation(v);
        const list = Array.isArray(res) ? res : [res];
        setSuggestions(list.filter(r => r && r.name));
        setOpen(list.length > 0);
      } catch { setSuggestions([]); setOpen(false); }
    }, 320);
  };

  const pick = (s) => { onChange(s.name || s.display || value); setOpen(false); setSuggestions([]); };

  return (
    <div className="relative flex-1 min-w-0">
      <span className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${dotColor}`} />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={() => setTimeout(() => setOpen(false), 160)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className="w-full bg-card/60 border border-lavender/15 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-silver/30 focus:outline-none focus:border-lavender/50 transition-colors"
        required
      />
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 top-full mt-1 left-0 right-0 glass rounded-xl overflow-hidden shadow-2xl border border-lavender/15"
          >
            {suggestions.slice(0, 5).map((s, i) => (
              <li key={i} onMouseDown={() => pick(s)}
                className="px-4 py-2.5 text-sm text-silver hover:bg-lavender/10 cursor-pointer flex items-center gap-2 truncate">
                <FiMapPin className="text-lavender text-xs flex-shrink-0" />
                <span className="truncate">{s.display || s.name}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SearchBar({ onSearch, loading }) {
  const [from, setFrom] = useState('');
  const [to, setTo]     = useState('');
  const [mode, setMode] = useState('any');
  const [pref, setPref] = useState('fastest');

  const swap = () => { const t = from; setFrom(to); setTo(t); };

  const submit = (e) => {
    e.preventDefault();
    if (!from.trim() || !to.trim()) return;
    onSearch({ from_location: from, to_location: to, mode, preference: pref });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass border-b border-lavender/10 px-4 py-3"
    >
      <form onSubmit={submit}>
        {/* Row 1: From / To / Search */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <LocationInput value={from} onChange={setFrom} placeholder="From — e.g. Trichy" dotColor="bg-mint" />

          <button type="button" onClick={swap}
            className="flex-shrink-0 p-2 rounded-lg bg-card/60 border border-lavender/15 text-lavender hover:bg-lavender/10 transition-colors"
            aria-label="Swap">
            <FiRefreshCw className="text-sm" />
          </button>

          <LocationInput value={to} onChange={setTo} placeholder="To — e.g. Ooty" dotColor="bg-lavender" />

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.96 }}
            className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-lavender to-mint text-bg font-semibold px-5 py-2.5 rounded-xl text-sm disabled:opacity-50 transition-all hover:opacity-90"
          >
            {loading
              ? <><div className="w-3.5 h-3.5 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />Searching</>
              : <><FiSearch />Search Routes</>
            }
          </motion.button>
        </div>

        {/* Row 2: Mode + Preference */}
        <div className="flex items-center gap-4 mt-2.5 flex-wrap">
          {/* Mode */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-silver/40 uppercase tracking-wider mr-1">Mode</span>
            {MODES.map(m => (
              <button key={m.id} type="button" onClick={() => setMode(m.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  mode === m.id
                    ? 'bg-gradient-to-r from-lavender to-mint text-bg'
                    : 'bg-card/50 text-silver/60 border border-lavender/10 hover:border-lavender/30'
                }`}>
                {m.label}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-lavender/15 hidden sm:block" />

          {/* Preference */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-silver/40 uppercase tracking-wider mr-1">Prefer</span>
            {PREFS.map(p => (
              <button key={p.id} type="button" onClick={() => setPref(p.id)}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  pref === p.id
                    ? 'bg-gradient-to-r from-gold/80 to-lavender/80 text-bg'
                    : 'bg-card/50 text-silver/60 border border-lavender/10 hover:border-lavender/30'
                }`}>
                {p.icon}{p.label}
              </button>
            ))}
          </div>
        </div>
      </form>
    </motion.div>
  );
}
