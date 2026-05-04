import React, { useState, useRef, useEffect } from 'react';
import { getCareerAdvice } from '../services/geminiService';
import { MOCK_TALENTS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

export const AICoach = ({ onBack }) => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hello! I'm your TokenJobs AI Career Coach. How can I help you accelerate your career today?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const advice = await getCareerAdvice(input, MOCK_TALENTS[0]);
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        text: advice || "I'm sorry, I couldn't process that. Could you try rephrasing?",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background animate-fade-in">
      <header className="glass px-6 py-5 flex items-center gap-4 border-b border-gray-100/50 sticky top-0 z-20">
        <button onClick={onBack} className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-accent bg-white shadow-sm">
          <span className="material-icons-round">arrow_back</span>
        </button>
        <div>
          <h2 className="text-xl font-display font-black text-accent tracking-tight">AI Career Coach</h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Always Online</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-5 rounded-[2rem] shadow-sm ${
                msg.sender === 'user' 
                  ? 'bg-primary text-white rounded-tr-none' 
                  : 'bg-white text-accent border border-gray-100 rounded-tl-none'
              }`}>
                <p className="text-[14px] font-medium leading-relaxed">{msg.text}</p>
                <span className={`text-[9px] font-black uppercase tracking-widest mt-2 block ${
                  msg.sender === 'user' ? 'text-white/90' : 'text-gray-700'
                }`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-5 rounded-[2rem] rounded-tl-none border border-gray-100 shadow-sm flex gap-1">
              <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-white border-t border-gray-100/50">
        <div className="flex gap-3 bg-gray-50 p-2 rounded-[2rem] border border-gray-100 shadow-inner-soft">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about resumes, interviews..."
            className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-3 text-sm font-medium placeholder:text-gray-600"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-all disabled:opacity-50"
          >
            <span className="material-icons-round">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
