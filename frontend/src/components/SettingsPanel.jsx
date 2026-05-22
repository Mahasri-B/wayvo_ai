import { FiMail, FiGithub, FiLinkedin, FiCode, FiGlobe } from 'react-icons/fi';

const links = [
  {
    icon: <FiMail size={16} />,
    label: 'Email',
    display: 'mahasribairavanathan@gmail.com',
    href: 'mailto:mahasribairavanathan@gmail.com',
    color: 'text-red-400',
  },
  {
    icon: <FiLinkedin size={16} />,
    label: 'LinkedIn',
    display: 'linkedin.com/in/mahasri10',
    href: 'https://linkedin.com/in/mahasri10',
    color: 'text-blue-400',
  },
  {
    icon: <FiGithub size={16} />,
    label: 'GitHub',
    display: 'github.com/Mahasri-B',
    href: 'https://github.com/Mahasri-B',
    color: 'text-gray-400',
  },
  {
    icon: <FiCode size={16} />,
    label: 'LeetCode',
    display: 'leetcode.com/u/mahasri_10',
    href: 'https://leetcode.com/u/mahasri_10',
    color: 'text-yellow-400',
  },
  {
    icon: <FiGlobe size={16} />,
    label: 'Portfolio',
    display: 'mahasri-b.github.io/portfolio',
    href: 'https://mahasri-b.github.io/portfolio/',
    color: 'text-purple-400',
  },
];

export default function SettingsPanel({ darkMode }) {
  const card = darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
  const text  = darkMode ? 'text-gray-100' : 'text-gray-800';
  const sub   = darkMode ? 'text-gray-500' : 'text-gray-400';
  const row   = darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50';

  return (
    <div className="w-full h-full overflow-y-auto flex justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">

        {/* Avatar + name */}
        <div className={`rounded-2xl border p-6 text-center ${card}`}>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center mx-auto mb-3 text-white text-2xl font-bold select-none">
            M
          </div>
          <h2 className={`text-lg font-bold ${text}`}>Mahasri Bairavanathan</h2>
          <p className={`text-sm mt-0.5 ${sub}`}>Builder of Wayvo AI · 2026</p>
        </div>

        {/* Links */}
        <div className={`rounded-2xl border overflow-hidden ${card}`}>
          <p className={`text-xs font-semibold uppercase tracking-widest px-5 pt-4 pb-2 ${sub}`}>Contact & Profiles</p>
          {links.map(({ icon, label, display, href, color }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 px-5 py-3 transition-colors ${row}`}
            >
              <span className={color}>{icon}</span>
              <div className="flex flex-col min-w-0">
                <span className={`text-xs ${sub}`}>{label}</span>
                <span className={`text-sm font-medium truncate ${text}`}>{display}</span>
              </div>
            </a>
          ))}
        </div>

      </div>
    </div>
  );
}
