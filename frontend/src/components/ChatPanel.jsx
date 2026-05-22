import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend } from 'react-icons/fi';
import { sendChatMessage } from '../utils/api';

const SUGGESTIONS_LEFT = [
  "What's the safest route to Ooty from Coimbatore?",
  "What local transport is available in Rameswaram?",
  "Are ghat roads safe during monsoon?",
];
const SUGGESTIONS_RIGHT = [
  "How do I reach Kodaikanal from Madurai?",
  "Compare bus vs train to Kanyakumari",
  "Best time to visit Yercaud?",
];

function Bubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-0.5"
          style={{ background: 'linear-gradient(135deg,#7C3AED,#9333EA)' }}>🤖</div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isUser ? 'bubble-user' : 'bubble-ai'}`}>
        {msg.content}
      </div>
    </motion.div>
  );
}

export default function ChatPanel({ routeContext }) {
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [showSuggestions, setShowSugg]  = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  // Listen for quick action events from sidebar
  useEffect(() => {
    const handler = (e) => { if (e.detail) send(e.detail); };
    window.addEventListener('quickAction', handler);
    return () => window.removeEventListener('quickAction', handler);
  }, [messages]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setShowSugg(false);
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await sendChatMessage(msg, routeContext, history);
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply || res.message || 'No response.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Could not connect to AI. Make sure Ollama is running.' }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="white-card flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #F3F4F6' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#7C3AED,#9333EA)' }}>🤖</div>
        <div>
          <p className="font-bold text-gray-900 text-sm">PathFinder AI</p>
          <p className="text-xs text-gray-400">Your Tamil Nadu Travel Expert</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="live-dot" />
          <span className="text-xs text-gray-400">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        {/* Welcome bubble */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start mb-4">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-0.5"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#9333EA)' }}>🤖</div>
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed text-gray-700"
            style={{ background: '#EDE9FE', border: '1px solid #DDD6FE' }}>
            Hi! I'm PathFinder TN — your Tamil Nadu travel expert. Ask me about routes, hill stations, local transport, safety tips, or anything about traveling in Tamil Nadu.
          </div>
        </motion.div>

        {/* Suggestion chips */}
        <AnimatePresence>
          {showSuggestions && messages.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-2 gap-2 mb-4">
              <div className="flex flex-col gap-2">
                {SUGGESTIONS_LEFT.map((s, i) => (
                  <motion.button key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }} onClick={() => send(s)} className="suggestion-chip-blue">{s}</motion.button>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                {SUGGESTIONS_RIGHT.map((s, i) => (
                  <motion.button key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 + 0.1 }} onClick={() => send(s)} className="suggestion-chip-amber">{s}</motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {messages.map((m, i) => <Bubble key={i} msg={m} />)}

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start mb-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-0.5"
              style={{ background: 'linear-gradient(135deg,#7C3AED,#9333EA)' }}>🤖</div>
            <div className="rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1"
              style={{ background: '#F3F4F6', border: '1px solid #E5E7EB' }}>
              {[0,1,2].map(i => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400"
                  animate={{ y: [0,-4,0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3" style={{ borderTop: '1px solid #F3F4F6' }}>
        <div className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ border: '1.5px solid #E5E7EB', background: '#F9FAFB' }}>
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask about routes, safety, local transport..."
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none" />
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#9333EA)' }}>
            <FiSend size={13} className="text-white" />
          </motion.button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          AI provides information • Please verify important details before travel
        </p>
      </div>
    </div>
  );
}
