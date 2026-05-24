import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mountain, MapPin, Train, Bus, AlertTriangle, Sun, CloudRain, Navigation } from 'lucide-react';
import { getHillStations } from '../utils/api';

const SEASON_COLOR = {
  best: 'text-green-600 bg-green-50',
  avoid: 'text-red-500 bg-red-50',
};

function WarningBadge({ text }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
      <AlertTriangle size={10} /> {text}
    </span>
  );
}

function HillCard({ hill, onClick, selected }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1 }}
      onClick={() => onClick(hill)}
      className="white-card p-3 cursor-pointer transition-all"
      style={{ border: selected ? '2px solid #7C3AED' : '1px solid #E5E7EB' }}
    >
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="font-bold text-gray-900 text-xs">{hill.name}</h3>
          <p className="text-xs text-gray-400">{hill.district} District</p>
        </div>
        <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 flex-shrink-0">
          {hill.elevation_m}m
        </span>
      </div>
      <div className="flex flex-wrap gap-1 mt-1">
        {hill.warnings?.slice(0, 1).map((w, i) => <WarningBadge key={i} text={w} />)}
      </div>
      <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
        <span className="flex items-center gap-1"><Sun size={10} className="text-green-500" /> {hill.best_season}</span>
      </div>
    </motion.div>
  );
}

function HillDetail({ hill }) {
  if (!hill) return (
    <div className="white-card h-full flex items-center justify-center text-center p-10">
      <div>
        <Mountain size={40} className="mx-auto mb-3 text-gray-200" />
        <p className="text-gray-400 text-sm">Select a hill station to see details</p>
      </div>
    </div>
  );

  return (
    <motion.div key={hill.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="white-card h-full overflow-y-auto p-3 md:p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-base md:text-xl font-bold text-gray-900">{hill.name}</h2>
          <p className="text-xs text-gray-400">{hill.district} District</p>
        </div>
        <div className="text-right">
          <div className="text-lg md:text-2xl font-bold" style={{ color: '#7C3AED' }}>{hill.elevation_m}m</div>
          <div className="text-xs text-gray-400">altitude</div>
        </div>
      </div>

      {/* Seasons */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-xl p-2 md:p-3 bg-green-50 border border-green-100">
          <div className="flex items-center gap-1 mb-0.5">
            <Sun size={11} className="text-green-600" />
            <span className="text-xs font-semibold text-green-700">Best Season</span>
          </div>
          <p className="text-xs text-green-800">{hill.best_season}</p>
        </div>
        <div className="rounded-xl p-2 md:p-3 bg-red-50 border border-red-100">
          <div className="flex items-center gap-1 mb-0.5">
            <CloudRain size={11} className="text-red-500" />
            <span className="text-xs font-semibold text-red-600">Avoid</span>
          </div>
          <p className="text-xs text-red-700">{hill.avoid_season}</p>
        </div>
      </div>

      {/* Warnings */}
      {hill.warnings?.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
            <AlertTriangle size={11} className="text-amber-500" /> Warnings
          </p>
          <div className="flex flex-wrap gap-1">
            {hill.warnings.map((w, i) => <WarningBadge key={i} text={w} />)}
          </div>
        </div>
      )}

      {/* Transport */}
      <div className="mb-3 space-y-1.5">
        <p className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
          <Navigation size={11} className="text-purple-500" /> How to Reach
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-2.5 py-1.5">
          <MapPin size={11} className="text-purple-400 flex-shrink-0" />
          <span>Nearest town: <strong>{hill.nearest_town}</strong></span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-2.5 py-1.5">
          <Train size={11} className="text-blue-400 flex-shrink-0" />
          <span>Railway: <strong>{hill.nearest_railway}</strong></span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-2.5 py-1.5">
          <Bus size={11} className="text-green-400 flex-shrink-0" />
          <span>Bus stand: <strong>{hill.nearest_bus_stand}</strong></span>
        </div>
      </div>

      {/* Connectivity */}
      {hill.connectivity_notes && (
        <div className="rounded-xl p-2.5 bg-purple-50 border border-purple-100">
          <p className="text-xs font-semibold text-purple-700 mb-1">Travel Notes</p>
          <p className="text-xs text-purple-800 leading-relaxed">{hill.connectivity_notes}</p>
        </div>
      )}
    </motion.div>
  );
}

export default function HillStations() {
  const [hills, setHills] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHillStations()
      .then(data => { setHills(data); setSelected(data[0] || null); })
      .catch(() => setHills([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-gray-400 text-sm">Loading hill stations...</div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row gap-2 md:gap-3 w-full h-full overflow-hidden">
      {/* Mobile: horizontal scroll list | Desktop: vertical list */}
      <div className="md:hidden flex-shrink-0 overflow-x-auto pb-1">
        <p className="text-xs font-semibold text-gray-500 px-1 mb-1.5">{hills.length} Hill Stations</p>
        <div className="flex gap-2 px-0.5">
          {hills.map(h => (
            <div key={h.name} onClick={() => setSelected(h)}
              className="flex-shrink-0 cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
              style={{
                background: selected?.name === h.name ? '#7C3AED' : '#fff',
                color: selected?.name === h.name ? '#fff' : '#374151',
                border: selected?.name === h.name ? '2px solid #7C3AED' : '1px solid #E5E7EB',
              }}>
              {h.name}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: detail fills remaining space */}
      <div className="md:hidden flex-1 min-h-0 overflow-hidden">
        <HillDetail hill={selected} />
      </div>

      {/* Desktop: side-by-side */}
      <div className="hidden md:block overflow-y-auto space-y-2 flex-shrink-0" style={{ width: 240 }}>
        <p className="text-xs font-semibold text-gray-500 px-1 mb-2">{hills.length} Hill Stations</p>
        {hills.map(h => (
          <HillCard key={h.name} hill={h} selected={selected?.name === h.name} onClick={setSelected} />
        ))}
      </div>
      <div className="hidden md:block flex-1 min-w-0">
        <HillDetail hill={selected} />
      </div>
    </div>
  );
}
