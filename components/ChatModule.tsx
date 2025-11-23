import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles, X } from 'lucide-react';
import { ConversationalNode } from '../types';
import { initiateBotanicalConsultation } from '../services/geminiService';

interface ChatModuleProps {
  isOpen: boolean;
  onClose: () => void;
  contextContext?: string; // Optional context from analyzed plant
}

export const ChatModule: React.FC<ChatModuleProps> = ({ isOpen, onClose, contextContext }) => {
  const [inputBuffer, setInputBuffer] = useState('');
  const [conversationHistory, setConversationHistory] = useState<ConversationalNode[]>([
    {
      id: 'init',
      role: 'model',
      content: contextContext
        ? `I see you're looking at a ${contextContext}. How can I assist with its care?`
        : "Greetings. I am Verida, your botanical intelligence unit. How may I assist your garden today?",
      timestamp: Date.now()
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationHistory, isOpen]);

  const handleTransmission = async () => {
    if (!inputBuffer.trim() || isProcessing) return;

    const userNode: ConversationalNode = {
      id: Date.now().toString(),
      role: 'user',
      content: inputBuffer,
      timestamp: Date.now()
    };

    setConversationHistory(prev => [...prev, userNode]);
    setInputBuffer('');
    setIsProcessing(true);

    try {
      // Transform history for API consumption
      // Filter out the initial greeting as Gemini expects interaction to start with User
      const apiHistory = conversationHistory
        .filter(node => node.id !== 'init')
        .map(node => ({
          role: node.role,
          parts: [{ text: node.content }]
        }));

      const responseText = await initiateBotanicalConsultation(apiHistory, userNode.content);

      const modelNode: ConversationalNode = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: Date.now()
      };

      setConversationHistory(prev => [...prev, modelNode]);
    } catch (error) {
      setConversationHistory(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: "I encountered a neural pathway disruption. Please try again.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-emerald-100 animate-in slide-in-from-bottom-10 fade-in duration-300">
        {/* Header */}
        <div className="bg-emerald-900 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold tracking-wide">Verida Assistant</span>
          </div>
          <button onClick={onClose} className="text-emerald-200 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-emerald-50/30">
          {conversationHistory.map((node) => (
            <div
              key={node.id}
              className={`flex gap-3 ${node.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${node.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-white border border-emerald-200 text-emerald-700'
                }`}>
                {node.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${node.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none'
                  : 'bg-white border border-emerald-100 text-emerald-900 rounded-tl-none'
                }`}>
                {node.content}
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-white border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-emerald-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1 items-center h-10">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-emerald-100">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputBuffer}
              onChange={(e) => setInputBuffer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTransmission()}
              placeholder="Ask about soil, pests, or light..."
              className="w-full bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-full py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-emerald-300 transition-all"
            />
            <button
              onClick={handleTransmission}
              disabled={!inputBuffer.trim() || isProcessing}
              className="absolute right-2 p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
