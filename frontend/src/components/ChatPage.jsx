import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiMapPin, FiAlertTriangle, FiZap } from 'react-icons/fi';
import { sendChatMessage } from '../utils/api';

const STARTERS = [
  "What's the safest route to Ooty from Coimbatore?",
  "How do I reach Kodaikanal from Madurai?",
  "What local transport is available in Rameswaram?",
  "Compare bus vs train to Kanyakumari",
  "Are ghat roads safe during monsoon?",
  "Best time to visit Yercaud?",
];

function TypingDots() {
  return (
    <div className="flex gap-1 px-1 py-0.5">
      {[0,1,2].map(i => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-lavender/60 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-5`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold
        ${isUser
          ? 'bg-gradient-to-br from-gold to-lavender text-bg'
          : 'bg-gradient-to-br from-lavender to-mint text-bg'
        }`}>
        {isUser ? 'U' : '🗺'}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed
        ${isUser ? 'bubble-user rounded-tr-sm' : 'bubble-ai rounded-tl-sm'}`}>
        {msg.content}
      </div>
    </motion.div>
  );
}

export default function ChatPage({ routeContext }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm PathFinder TN — your Tamil Nadu travel expert. Ask me about routes, hill stations, local transport, safety tips, or anything about traveling in Tamil Nadu.",
    },
  ]);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const res = await sendChatMessage(msg, routeContext, history);
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Could not reach the AI service. Make sure Ollama is running: `ollama run llama3`',
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const showStarters = messages.length <= 1;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-lavender/10">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lavender to-mint flex items-center justify-center text-bg text-sm">🗺</div>
        <div>
          <div className="text-white font-semibold text-sm">PathFinder AI</div>
          <div className="text-lavender/60 text-xs flex items-center gap-1">
            <FiZap className="text-gold text-xs" /> Llama 3 · Tamil Nadu Expert
          </div>
        </div>
        {routeContext && (
          <div className="ml-auto flex items-center gap-1.5 text-xs bg-mint/10 border border-mint/20 text-mint px-3 py-1 rounded-full">
            <FiMapPin className="text-xs" />
            {routeContext.from_location} → {routeContext.to_location}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {messages.map((m, i) => <Message key={i} msg={m} />)}

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 mb-5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lavender to-mint flex items-center justify-center text-bg text-sm flex-shrink-0">🗺</div>
            <div className="bubble-ai rounded-2xl rounded-tl-sm px-4 py-3"><TypingDots /></div>
          </motion.div>
        )}

        {/* Starter suggestions */}
        {showStarters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
            {STARTERS.map((s, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => send(s)}
                className="text-left text-xs text-silver/70 bg-card/50 border border-lavender/10 hover:border-lavender/40 hover:text-silver rounded-xl px-4 py-3 transition-all"
              >
                {s}
              </motion.button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-4 border-t border-lavender/10">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about routes, safety, local transport..."
            className="flex-1 bg-card/60 border border-lavender/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-silver/30 focus:outline-none focus:border-lavender/50 resize-none transition-colors"
            style={{ maxHeight: '120px' }}
          />
          <motion.button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-lavender to-mint text-bg flex items-center justify-center disabled:opacity-40 transition-all hover:opacity-90 flex-shrink-0"
            aria-label="Send"
          >
            <FiSend className="text-sm" />
          </motion.button>
        </div>
        <p className="text-[11px] text-silver/25 mt-1.5 text-center">
          AI explains routes — does not invent transport data
        </p>
      </div>
    </div>
  );
}
