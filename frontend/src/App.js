import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import Home from './pages/Home';

function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [darkMode, setDarkMode]   = useState(() => {
    return localStorage.getItem('wayvo-dark') === 'true';
  });

  // Apply dark class to <html> so Tailwind dark: variants work
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('wayvo-dark', darkMode);
  }, [darkMode]);

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-200 ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} darkMode={darkMode} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopNav darkMode={darkMode} onToggleDark={() => setDarkMode(d => !d)} />
        <div className="flex-1 overflow-hidden">
          <Home activeTab={activeTab} onTabChange={setActiveTab} darkMode={darkMode} />
        </div>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: darkMode ? '#1f2937' : '#fff',
            color: darkMode ? '#f9fafb' : '#374151',
            border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
            fontSize: '13px',
          },
        }}
      />
    </div>
  );
}

export default App;
