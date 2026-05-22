import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMapPin, FiArrowRight, FiSearch, FiRefreshCw } from 'react-icons/fi';
import { searchLocation } from '../utils/api';

const MODES = ['any', 'train', 'bus', 'car', 'local'];
const PREFS = ['fastest', 'cheapest', 'scenic', 'safest'];
const PREF_ICONS = { fastest: '⚡', cheapest: '💰', scenic: '🏔️', safest: '🛡️' };

function LocationInput({ value, onChange, onSelect, placeholder, icon }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const debounce = useRef(null);

  const handleChange = (e) => {
    const v = e.target.value;
    onChange(v);
    clearTimeout(debounce.current);
    if (v.length < 2) { setSuggestions([]); setOpen(false); return; }
    debounce.current = setTimeout(async () => {
      try {
        const results = await searchLocation(v);
        const list = Array.isArray(results) ? results : [results];
        setSuggestions(list.filter(r => r.name));
        setOpen(list.length > 0);
      } catch { setSuggestions([]); setOpen(false); }
    }, 350);
  };

  const pick = (s) => {
    onChange(s.name || s.display || value);
    onSelect && onSelect(s);
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <div className="flex-1 relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 text-sm pointer-events-none">{icon}</span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        className="w-full bg-dark-700 border border-green-900/40 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-green-900 focus:outline-none focus:border-green-600 transition-colors"
        required
      />
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 top-full mt-1 left-0 right-0 bg-dark-800 border border-green-900/40 rounded-xl overflow-hidden shadow-xl"
          >
            {suggestions.slice(0, 5).map((s, i) => (
              <li
                key={i}
                onMouseDown={() => pick(s)}
                className="px-4 py-2.5 text-sm text-green-100 hover:bg-green-900/30 cursor-pointer flex items-center gap-2"
              >
                <FiMapPin className="text-green-600 text-xs flex-shrink-0" />
                <span className="truncate">{s.display || s.name}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SearchPanel({ onSearch, loading }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [fromCoords, setFromCoords] = useState(null);
  const [toCoords, setToCoords] = useState(null);
  const [mode, setMode] = useState('any');
  const [pref, setPref] = useState('fastest');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!from.trim() || !to.trim()) return;
    onSearch({ from_location: from, to_location: to, mode, preference: pref });
  };

  const swap = () => {
    setFrom(to); setTo(from);
    setFromCoords(toCoords); setToCoords(fromCoords);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass rounded-2xl p-6 border-glow"
    >
      <div className="flex items-center gap-2 mb-5">
        <FiSearch className="text-green-400 text-lg" />
        <h2 className="text-white font-semibold text-lg">Find Your Route</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <LocationInput
            value={from}
            onChange={setFrom}
            onSelect={(s) => setFromCoords(s)}
            placeholder="From (e.g. Trichy)"
            icon={<FiMapPin />}
          />
          <button
            type="button"
            onClick={swap}
            className="p-2 rounded-lg bg-green-900/30 hover:bg-green-900/50 text-green-400 transition-colors flex-shrink-0"
            aria-label="Swap locations"
          >
            <FiRefreshCw className="text-sm" />
          </button>
          <LocationInput
            value={to}
            onChange={setTo}
            onSelect={(s) => setToCoords(s)}
            placeholder="To (e.g. Ooty)"
            icon={<FiMapPin className="text-green-400" />}
          />
        </div>

        <div>
          <p className="text-xs text-green-700 mb-2 font-medium uppercase tracking-wider">Transport Mode</p>
          <div className="flex flex-wrap gap-2">
            {MODES.map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  mode === m ? 'bg-green-600 text-white shadow-lg shadow-green-900/40'
                  : 'bg-dark-700 text-green-600 border border-green-900/30 hover:border-green-700'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-green-700 mb-2 font-medium uppercase tracking-wider">Preference</p>
          <div className="flex flex-wrap gap-2">
            {PREFS.map((p) => (
              <button key={p} type="button" onClick={() => setPref(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all flex items-center gap-1.5 ${
                  pref === p ? 'bg-green-600 text-white shadow-lg shadow-green-900/40'
                  : 'bg-dark-700 text-green-600 border border-green-900/30 hover:border-green-700'}`}>
                <span>{PREF_ICONS[p]}</span>{p}
              </button>
            ))}
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-900/30"
        >
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Finding routes...</>
          ) : (
            <><FiSearch />Search Routes<FiArrowRight /></>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}
