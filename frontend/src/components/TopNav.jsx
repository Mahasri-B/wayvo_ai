import { FiSun, FiMoon, FiChevronDown } from 'react-icons/fi';
import wavyvoLogo from '../assets/wavyvo-logo.png';

export default function TopNav({ darkMode, onToggleDark }) {
  return (
    <header
      className="flex items-center justify-between px-3 md:px-5 flex-shrink-0"
      style={{
        height: 52,
        background: darkMode ? '#111827' : '#fff',
        borderBottom: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      {/* Logo + name */}
      <div className="flex items-center gap-2">
        <img src={wavyvoLogo} alt="Wayvo AI" style={{ height: 28, width: 28, objectFit: 'contain' }} />
        <span className={`font-bold text-sm md:text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>Wayvo AI</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 md:gap-3">
        <div className="flex items-center gap-1.5">
          <span className="live-dot" />
          <span className="text-xs md:text-sm font-medium" style={{ color: '#22C55E' }}>Live</span>
        </div>
        <button
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700 border-gray-600' : 'text-gray-700 hover:bg-gray-50 border-gray-200'}`}
          style={{ border: `1px solid ${darkMode ? '#4B5563' : '#E5E7EB'}` }}
        >
          Llama 3 <FiChevronDown size={13} className={darkMode ? 'text-gray-400' : 'text-gray-400'} />
        </button>
        <button
          onClick={onToggleDark}
          className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-yellow-400 hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-100'}`}
          aria-label="Toggle dark mode"
        >
          {darkMode ? <FiSun size={16} /> : <FiMoon size={16} />}
        </button>
      </div>
    </header>
  );
}
