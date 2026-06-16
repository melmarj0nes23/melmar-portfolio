import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Post } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatBotProps {
  profile: UserProfile;
  posts: Post[];
}

export default function AIChatBot({ profile, posts }: AIChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi there! I am Joshua, Melmar's AI smart assistant. 👋 Ask me anything about Melmar's developer skills, projects, background, or how to get in touch. How can I help you today?`
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasNewBadge, setHasNewBadge] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Programmatic cleaner to strip out messy symbols like raw double/triple asterisks, lines, or hash headers
  const cleanResponse = (text: string): string => {
    return text
      // Remove any lines consisting entirely of three or more dashes, asterisks or underscores (e.g. ---, ***, ____)
      .replace(/^[ \t]*[-*_]{3,}[ \t]*$/gm, '')
      // Replace triple asterisks with standard double asterisks or none
      .replace(/\*\*\*/g, '**')
      // Remove hash headers like ### or ## entirely or format them cleanly
      .replace(/^[ \t]*#{1,6}\s*(.*)$/gm, '$1')
      // Maximize line break separation to 2 lines máximo
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  // Auto scroll to bottom when messages or loading changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Remove the unread notification badge once chat is opened
  useEffect(() => {
    if (isOpen) {
      setHasNewBadge(false);
    }
  }, [isOpen]);

  // Listen to custom window event to open the AI chat from external buttons
  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
    };
    window.addEventListener('open-ai-chat', handleOpenChat);
    return () => {
      window.removeEventListener('open-ai-chat', handleOpenChat);
    };
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || isLoading) return;
    sendMessage(inputMsg);
    setInputMsg('');
  };

  const sendMessage = async (text: string) => {
    const rawUserMsg = text.trim();
    if (!rawUserMsg) return;

    // Append user message
    const userMessage: Message = { role: 'user', content: rawUserMsg };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: rawUserMsg,
          history: messages.map(m => ({
            role: m.role,
            text: m.content
          })),
          projects: (posts || []).map(p => ({
            title: p.title,
            description: p.description,
            tags: p.tags || []
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Could not get a response from the server.');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: cleanResponse(data.reply) }]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMsg(err.message || 'Connecting to server failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 font-sans" id="ai-chatbot-widget">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="w-80 sm:w-96 h-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:h-[80vh] max-sm:w-full max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:z-50 max-sm:border-t max-sm:border-gray-200"
          >
            {/* Widget Messenger Header */}
            <div className="bg-[#4f46e5] text-white p-4 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full border border-white/20 overflow-hidden bg-white/10 shrink-0">
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-px right-px w-2.5 h-2.5 bg-green-500 border border-white rounded-full" />
                </div>
                <div>
                  <div className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                    Joshua
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300 animate-pulse" />
                  </div>
                  <span className="text-[10px] text-indigo-100 font-medium">Melmar's AI Assistant</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/90 hover:text-white"
                id="close-ai-chat-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conversation Flow Area */}
            <div className="flex-grow p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3 min-h-0">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="max-w-[85%] flex items-start gap-2">
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-200 bg-white shrink-0 mt-0.5">
                        <img
                          src={profile.avatar}
                          alt={profile.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-3.5 py-2 text-xs leading-relaxed break-words whitespace-pre-line ${
                        msg.role === 'user'
                          ? 'bg-[#4f46e5] text-white rounded-tr-none shadow-sm'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-sm shadow-black/5'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}

              {/* Bot Loading Pulsing Indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-200 bg-white shrink-0 mt-0.5 animate-bounce">
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="bg-white border border-gray-200 text-gray-400 rounded-2xl rounded-tl-none px-4 py-2 text-xs flex gap-1 items-center shadow-sm">
                      <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce" />
                      <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}

              {/* Error indicator */}
              {errorMsg && (
                <div className="bg-red-50 border border-red-100 text-red-600 rounded-lg p-3 text-xs flex items-start gap-2 animate-in fade-in zoom-in-95 duration-150">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-grow">
                    <p className="font-semibold">Chat connection issue</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-red-500/80">{errorMsg}</p>
                    <button
                      onClick={() => {
                        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
                        if (lastUserMsg) sendMessage(lastUserMsg.content);
                      }}
                      className="mt-1.5 flex items-center gap-1 font-bold text-[10px] text-red-700 hover:underline"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Try Sending Again
                    </button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Form input messaging */}
            <form onSubmit={handleFormSubmit} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                disabled={isLoading}
                placeholder="Ask about skills, projects, background..."
                className="flex-grow text-base sm:text-xs px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-50 disabled:bg-gray-100 text-gray-800"
                maxLength={400}
                required
              />
              <button
                type="submit"
                disabled={isLoading || !inputMsg.trim()}
                className="p-2 rounded-full bg-[#4f46e5] text-white hover:bg-indigo-700 transition-all shadow disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Sparkly Launcher Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="relative p-3.5 rounded-full bg-[#4f46e5] hover:bg-indigo-700 text-white shadow-2xl transition-colors cursor-pointer flex items-center justify-center group"
            id="ai-messenger-floating-badge"
            title="Chat with Joshua"
          >
            <MessageSquare className="w-6 h-6 group-hover:rotate-6 transition-transform duration-200" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-pink-500 text-[9px] font-bold text-white items-center justify-center">
                {hasNewBadge ? '1' : '!'}
              </span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
