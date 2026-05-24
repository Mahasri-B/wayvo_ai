import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageCircle, Route, Map, Mountain,
  Heart, Settings
} from 'lucide-react';
import wavyvoLogo from '../assets/wavyvo-logo.png';
import travelohImg from '../assets/traveloh.png';

const NAV_ITEMS = [
  { id: 'chat',      label: 'AI Chat',        Icon: MessageCircle },
  { id: 'routes',    label: 'Routes',          Icon: Route },
  { id: 'map',       label: 'Map',             Icon: Map },
  { id: 'hills',     label: 'Hill Stations',   Icon: Mountain },
  { id: 'saved',     label: 'Saved Trips',     Icon: Heart },
  { id: 'settings',  label: 'Settings',        Icon: Settings },
];

export default function Sidebar({ activeTab, onTabChange }) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col flex-shrink-0 h-full" style={{ width: 200, background: '#3D1A6E' }}>
        {/* Logo */}
        <div className="px-4 pt-4 pb-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <img src={wavyvoLogo} alt="Wayvo AI" className="object-contain" style={{ height: 36, width: 36 }} />
          <span className="text-white font-bold text-base leading-tight">Wayvo AI</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll px-2 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <motion.button
              key={id}
              whileTap={{ scale: 0.97 }}
              onClick={() => onTabChange(id)}
              className={`nav-item w-full text-left ${activeTab === id ? 'active' : ''}`}
            >
              <Icon size={15} className="flex-shrink-0" />
              <span>{label}</span>
            </motion.button>
          ))}
        </nav>

        {/* Bottom image card */}
        <div className="mx-2 mb-3 rounded-xl overflow-hidden flex-shrink-0"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          <img src={travelohImg} alt="Explore Tamil Nadu"
            style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-1 py-1"
        style={{ background: '#3D1A6E', borderTop: '1px solid rgba(255,255,255,0.12)', height: 60 }}>
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <motion.button
            key={id}
            whileTap={{ scale: 0.92 }}
            onClick={() => onTabChange(id)}
            className="flex flex-col items-center gap-0.5 flex-1 py-1"
          >
            <Icon size={18} style={{ color: activeTab === id ? '#C4B5FD' : 'rgba(255,255,255,0.5)' }} />
            <span className="text-[9px] leading-tight"
              style={{ color: activeTab === id ? '#C4B5FD' : 'rgba(255,255,255,0.45)', fontWeight: activeTab === id ? 600 : 400 }}>
              {label === 'Hill Stations' ? 'Hills' : label === 'Saved Trips' ? 'Saved' : label === 'AI Chat' ? 'Chat' : label}
            </span>
          </motion.button>
        ))}
      </nav>
    </>
  );
}
