import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Shield, Star, AlertTriangle, ChevronDown, ChevronUp, Bus, Train, Car, Navigation, MapPin } from 'lucide-react';

const MODE_STYLE = {
  bus:        { bg: '#EFF6FF', color: '#2563EB', Icon: Bus },
  train:      { bg: '#F5F3FF', color: '#7C3AED', Icon: Train },
  auto:       { bg: '#FFFBEB', color: '#D97706', Icon: Car },
  share_auto: { bg: '#FFFBEB', color: '#D97706', Icon: Car },
  walk:       { bg: '#F0FDF4', color: '#16A34A', Icon: Navigation },
  van:        { bg: '#EFF6FF', color: '#2563EB', Icon: Car },
  ferry:      { bg: '#F0F9FF', color: '#0EA5E9', Icon: Navigation },
  car:        { bg: '#F9FAFB', color: '#6B7280', Icon: Car },
  default:    { bg: '#F9FAFB', color: '#6B7280', Icon: MapPin },
};

function Dots({ value, max = 5, color }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} className="w-1.5 h-1.5 rounded-full"
          style={{ background: i < value ? color : '#E5E7EB' }} />
      ))}
    </div>
  );
}

export default function RouteCard({ route, index, onSelect, isSelected }) {
  const [expanded, setExpanded] = useState(false);
  const hrs  = Math.floor(route.total_duration_minutes / 60);
  const mins = route.total_duration_minutes % 60;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}
      onClick={() => onSelect?.(route)}
      className="white-card p-4 cursor-pointer transition-all hover:shadow-md"
      style={{ borderColor: isSelected ? '#7C3AED' : undefined, boxShadow: isSelected ? '0 0 0 2px #7C3AED33' : undefined }}>

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#7C3AED' }}>
              #{index + 1}
            </span>
            <span className="text-xs text-gray-400 capitalize">{route.route_type}</span>
          </div>
          <h3 className="text-gray-900 font-semibold text-sm truncate">{route.label}</h3>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-bold text-base" style={{ color: '#7C3AED' }}>Rs.{route.total_fare_inr}</div>
          <div className="text-xs text-gray-400">{hrs > 0 ? `${hrs}h ` : ''}{mins}m</div>
        </div>
      </div>

      {/* Mode chain */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        {route.legs.map((leg, i) => {
          const s = MODE_STYLE[leg.mode] || MODE_STYLE.default;
          return (
            <div key={i} className="flex items-center gap-1">
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg font-medium"
                style={{ background: s.bg, color: s.color }}>
                <s.Icon size={11} />
                {leg.mode.replace('_', ' ')}
              </span>
              {i < route.legs.length - 1 && <span className="text-gray-300 text-xs">›</span>}
            </div>
          );
        })}
      </div>

      {/* Ratings */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <Shield size={12} style={{ color: '#22C55E' }} />
          <Dots value={route.safety_rating} color="#22C55E" />
        </div>
        <div className="flex items-center gap-1.5">
          <Star size={12} style={{ color: '#F59E0B' }} />
          <Dots value={route.scenic_rating} color="#F59E0B" />
        </div>
        <div className="flex items-center gap-1 ml-auto text-xs text-gray-400">
          <Clock size={11} />{hrs > 0 ? `${hrs}h ` : ''}{mins}m
        </div>
      </div>

      {/* Warning */}
      {route.warnings?.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg px-3 py-2 mb-3"
          style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
          <AlertTriangle size={12} style={{ color: '#D97706', marginTop: 2, flexShrink: 0 }} />
          <p className="text-xs" style={{ color: '#D97706' }}>{route.warnings[0]}</p>
        </div>
      )}

      <button onClick={e => { e.stopPropagation(); setExpanded(!expanded); }}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-purple-600 transition-colors">
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? 'Less' : 'View legs'}
      </button>

      {expanded && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 space-y-2 pt-3" style={{ borderTop: '1px solid #F3F4F6' }}>
          {route.legs.map((leg, i) => {
            const s = MODE_STYLE[leg.mode] || MODE_STYLE.default;
            return (
              <div key={i} className="flex items-start gap-3 text-xs">
                <s.Icon size={14} style={{ color: s.color, marginTop: 2, flexShrink: 0 }} />
                <div className="flex-1">
                  <div className="text-gray-800 font-medium">{leg.from_stop} › {leg.to_stop}</div>
                  <div className="text-gray-400 mt-0.5">
                    {leg.operator && <span>{leg.operator} · </span>}
                    {leg.route_number && <span>#{leg.route_number} · </span>}
                    {leg.departure_time && <span>Dep {leg.departure_time} · </span>}
                    <span>{leg.duration_minutes}m · Rs.{leg.fare_inr}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
