import { motion } from 'framer-motion';
import { FiZap, FiMapPin, FiCloud, FiTriangle, FiFileText } from 'react-icons/fi';

const ACTIONS = [
  {
    id: 'nearby',
    icon: <FiMapPin size={16} />,
    label: 'Find Nearby Stations',
    iconBg: '#EFF6FF',
    iconColor: '#3B82F6',
  },
  {
    id: 'weather',
    icon: <FiCloud size={16} />,
    label: 'Check Weather',
    iconBg: '#F0F9FF',
    iconColor: '#0EA5E9',
  },
  {
    id: 'hill-safety',
    icon: <FiTriangle size={16} />,
    label: 'Hill Road Safety Tips',
    iconBg: '#F0FDF4',
    iconColor: '#22C55E',
  },
  {
    id: 'guidelines',
    icon: <FiFileText size={16} />,
    label: 'Travel Guidelines',
    iconBg: '#FFF7ED',
    iconColor: '#F97316',
  },
];

export default function QuickActions({ onAction }) {
  return (
    <div className="white-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid #F3F4F6' }}>
        <FiZap size={16} style={{ color: '#3B82F6' }} />
        <span className="font-semibold text-sm text-gray-800">Quick Actions</span>
      </div>

      {/* Action list */}
      <div className="p-2">
        {ACTIONS.map((action, i) => (
          <motion.button
            key={action.id}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => onAction?.(action.id)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-gray-50 transition-colors group"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
              style={{ background: action.iconBg, color: action.iconColor }}
            >
              {action.icon}
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
              {action.label}
            </span>
            <span className="ml-auto text-gray-300 group-hover:text-gray-400 text-xs">›</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
