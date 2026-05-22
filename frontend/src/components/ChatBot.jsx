import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiMessageSquare, FiX, FiMinimize2 } from 'react-icons/fi';
import { sendChatMessage } from '../utils/api';

const SUGGESTIONS = [
  'What is the safest route to Ooty?',
  'How do I reach Kodaikanal from Madurai?',
  'Are there any road alerts today?',
  'What local transport is available in Rameswaram?',
  'Compare bus vs train to Kanyakumari',
];

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-0.5">
          🗺️
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'chat-bubble-user text-white rounded-br-sm'
            : 'chat-bubble-ai text-green-100 rounded-bl-sm'
        }`}
      >
        {msg.content}
      </div>
    </motion.div>
  );
}

export default function ChatBot({ routeContext }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm Wayvo AI. Ask me anything about traveling in Tamil Nadu — routes, safety, local transport, or hill station tips.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');

    const userMsg = { role: 'user', content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const res = await sendChatMessage(msg, routeContext, history);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Could not connect to AI. Make sure Ollama is running or set a GROQ_API_KEY in backend/.env.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-700 shadow-xl shadow-green-900/40 flex items-center justify-center text-white text-xl transition-all ${open ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        aria-label="Open chat"
      >
        <FiMessageSquare />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-dark-900 animate-pulse-slow" />
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] glass rounded-2xl border-glow flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-green-900/30 bg-dark-800/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-sm">
                  🗺️
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">Wayvo AI</div>
                  <div className="text-green-600 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-slow" />
                    Llama 3 · Tamil Nadu Expert
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-green-700 hover:text-green-400 transition-colors p-1"
                aria-label="Close chat"
              >
                <FiX />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {messages.map((msg, i) => (
                <Message key={i} msg={msg} />
              ))}
              {loading && (
                <div className="flex justify-start mb-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-xs mr-2 flex-shrink-0">
                    🗺️
                  </div>
                  <div className="chat-bubble-ai rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-green-500 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
                {SUGGESTIONS.slice(0, 3).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => send(s)}
                    className="flex-shrink-0 text-xs bg-green-950/50 border border-green-800/30 text-green-400 px-3 py-1.5 rounded-full hover:border-green-600 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-green-900/30">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                  placeholder="Ask about routes, safety, transport..."
                  className="flex-1 bg-dark-700 border border-green-900/40 rounded-xl px-3 py-2 text-sm text-white placeholder-green-900 focus:outline-none focus:border-green-600 transition-colors"
                />
                <motion.button
                  onClick={() => send()}
                  whileTap={{ scale: 0.9 }}
                  disabled={loading || !input.trim()}
                  className="w-9 h-9 rounded-xl bg-green-600 hover:bg-green-500 text-white flex items-center justify-center transition-colors disabled:opacity-40"
                  aria-label="Send message"
                >
                  <FiSend className="text-sm" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
