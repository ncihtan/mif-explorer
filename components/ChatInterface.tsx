import React, { useState, useRef, useEffect } from 'react';
import { chatService } from '../services/geminiService';
import { useData } from '../hooks/useData';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const ChatInterface: React.FC = () => {
  const { isLoading: isDataLoading } = useData();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: "Hello! I'm your biological data assistant. Ask me about files, panels, or filter the dataset." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Reset the AI session when the Chat component mounts to sync history
  useEffect(() => {
    chatService.resetSession();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const responseText = await chatService.sendMessage(userMsg.content);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: responseText };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "Sorry, I had trouble processing that request." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isDataLoading) {
    return (
      <div className="flex flex-col h-full bg-slate-50 items-center justify-center p-8">
        <div className="w-6 h-6 bg-blue-600 rounded-full animate-ping mb-4"></div>
        <p className="text-xs text-slate-500 font-medium">Initializing Agent...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="bg-white p-4 border-b border-slate-100 flex items-center space-x-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">mIF Assistant</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Gemini 2.5 Flash</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none shadow-sm' 
                  : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none shadow-sm'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-3 py-2 shadow-sm">
                <div className="flex space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100" />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-slate-100 bg-white flex-shrink-0">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about data..."
              className="w-full pl-3 pr-10 py-2 bg-slate-50 text-slate-900 placeholder-slate-400 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-[42px] leading-tight text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="absolute right-1.5 top-1.5 p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <svg className="w-3 h-3 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-2">AI can make mistakes. Check important info.</p>
        </div>
    </div>
  );
};