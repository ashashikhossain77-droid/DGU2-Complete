/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  RotateCcw,
  Zap,
  Layers,
  Cpu,
  Settings2,
  Copy,
  Check,
  Minimize2,
  Maximize2,
  Radio,
  Clock,
  HelpCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { LineEntry, UserProfile } from '../types';

export type ChatRoleType = 'general' | 'complex' | 'fast';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

interface GeminiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  lines?: LineEntry[];
  profile?: UserProfile;
}

const ROLE_CONFIGS: Record<
  ChatRoleType,
  {
    name: string;
    model: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    systemInstruction: string;
  }
> = {
  general: {
    name: 'IE Productivity Advisor',
    model: 'gemini-3.5-flash',
    desc: 'General line productivity, 5S standards, SAM targets & factory workflow',
    icon: Bot,
    accentColor: '#176f78',
    systemInstruction:
      'You are a Senior Industrial Engineering (IE) Consultant for a high-volume apparel manufacturing factory. Help with productivity improvement, line efficiency, 5S standards, and operator performance.'
  },
  complex: {
    name: 'Deep Line Balancing Specialist',
    model: 'gemini-3.1-pro-preview',
    desc: 'Complex Yamazumi charts, pitch time balancing, workstation pitch loss & bottleneck splitting',
    icon: Cpu,
    accentColor: '#e6813e',
    systemInstruction:
      'You are a Principal Industrial Engineer & Operations Research Specialist specializing in Line Balancing, Yamazumi Workload Distribution, SMV calculation, Pitch Diagramming, Bottleneck Splitting, and Takt Time Optimization. Provide mathematically grounded, precise diagnostic calculations and steps.'
  },
  fast: {
    name: 'Rapid Floor Assistant',
    model: 'gemini-3.1-flash-lite',
    desc: 'Instant troubleshooting for floor supervisors & immediate sewing pacing issues',
    icon: Zap,
    accentColor: '#c9982f',
    systemInstruction:
      'You are an agile On-Floor Assistant for Garment Sewing Supervisors and Line Leaders. Give rapid, punchy, direct 2-4 bullet point directives to solve immediate floor challenges.'
  }
};

const SUGGESTED_QUESTIONS = [
  'Which line has the highest bottleneck risk today?',
  'How to balance a 45-operator polo shirt sewing line?',
  'Calculate theoretical pitch time for SMV 18.5 min with 50 MP',
  'What is the standard WIP buffer between sewing workstations?',
  'How to recover 5% efficiency drop during the afternoon shift?'
];

export const GeminiChatModal: React.FC<GeminiChatModalProps> = ({
  isOpen,
  onClose,
  lines = [],
  profile
}) => {
  const [roleType, setRoleType] = useState<ChatRoleType>('general');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('ie_gemini_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'msg_welcome',
        role: 'model',
        content: `Hello ${profile?.name || 'Engineer'}! I am your AI Industrial Engineering Chatbot powered by Google Gemini.\n\nI can analyze real-time shop floor lines, balance workstation cycles, resolve bottlenecks, and optimize operator assignments. How can I help you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'gemini-3.5-flash'
      }
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [includeTelemetry, setIncludeTelemetry] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customSystemPrompt, setCustomSystemPrompt] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Save conversation history to local storage
  useEffect(() => {
    try {
      localStorage.setItem('ie_gemini_chat_history', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  if (!isOpen) return null;

  const currentRole = ROLE_CONFIGS[roleType];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);

    try {
      // Build active floor telemetry summary for IE context
      const factoryTelemetry = includeTelemetry
        ? {
            activeLinesCount: lines.length,
            averageEfficiency: lines.length
              ? Math.round(lines.reduce((acc, l) => acc + (l.efficiency || 0), 0) / lines.length)
              : 0,
            lines: lines.slice(0, 10).map(l => ({
              lineNo: l.lineNo,
              floor: l.floor,
              style: l.style,
              buyer: l.buyer,
              efficiency: l.efficiency,
              targetEff: l.targetEff,
              plannedMP: l.plannedMP,
              wip: l.wip,
              smv: l.smv
            }))
          }
        : undefined;

      const payload = {
        messages: newHistory.map(m => ({
          role: m.role,
          content: m.content
        })),
        roleType,
        customSystemInstruction: customSystemPrompt.trim() || undefined,
        factoryTelemetry
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Chat API error (${res.status})`);
      }

      const data = await res.json();
      const modelMessage: ChatMessage = {
        id: `bot_${Date.now()}`,
        role: 'model',
        content: data.reply || 'No response received.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed || currentRole.model
      };

      setMessages(prev => [...prev, modelMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'model',
        content: `I encountered an issue connecting to the AI service. Please verify your connection or retry.\n\n*Error: ${err.message || 'Network request failed'}*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'Error Fallback'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    if (confirm('Clear chat conversation history?')) {
      const resetMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'model',
        content: `Conversation reset. Ready for your next Industrial Engineering inquiry.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: currentRole.model
      };
      setMessages([resetMsg]);
      localStorage.removeItem('ie_gemini_chat_history');
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className={`relative w-full rounded-3xl bg-[#fbfaf6] border border-[#d9d2c2] shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isExpanded ? 'max-w-5xl h-[94vh]' : 'max-w-3xl h-[86vh]'
        }`}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-[#e7e1d5] bg-white flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs text-white"
              style={{ backgroundColor: currentRole.accentColor }}
            >
              <currentRole.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base font-bold text-[#17343a]">
                  Garment IE Chatbot
                </h2>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono-numbers text-white flex items-center gap-1 shadow-2xs"
                  style={{ backgroundColor: currentRole.accentColor }}
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  {currentRole.model}
                </span>
              </div>
              <p className="text-xs text-[#527078] line-clamp-1">{currentRole.desc}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                showSettings ? 'bg-[#176f78]/15 text-[#176f78]' : 'text-[#527078] hover:bg-[#f1eee6]'
              }`}
              title="Chat persona settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleClearHistory}
              className="p-2 rounded-xl text-[#527078] hover:bg-[#f1eee6] transition-colors cursor-pointer"
              title="Reset conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="hidden sm:inline-flex p-2 rounded-xl text-[#527078] hover:bg-[#f1eee6] transition-colors cursor-pointer"
              title={isExpanded ? 'Restore size' : 'Expand window'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#527078] hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
              title="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Role Presets Bar (Required multi-model support: 3.1-pro-preview, 3.5-flash, 3.1-flash-lite) */}
        <div className="px-4 sm:px-6 py-2 bg-[#f4f1ea] border-b border-[#e7e1d5] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-[#527078] uppercase tracking-wider mr-1">
              AI Persona:
            </span>
            {(['general', 'complex', 'fast'] as ChatRoleType[]).map(r => {
              const cfg = ROLE_CONFIGS[r];
              const isActive = roleType === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleType(r)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#17343a] shadow-xs border border-[#d9d2c2]'
                      : 'text-[#527078] hover:text-[#17343a] hover:bg-white/60'
                  }`}
                >
                  <cfg.icon className="w-3.5 h-3.5" />
                  <span>{cfg.name.split(' ')[0]}</span>
                  <span className="text-[10px] font-mono-numbers opacity-70">({cfg.model})</span>
                </button>
              );
            })}
          </div>

          <label className="flex items-center gap-1.5 text-xs text-[#527078] shrink-0 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeTelemetry}
              onChange={e => setIncludeTelemetry(e.target.checked)}
              className="rounded text-[#176f78] focus:ring-[#176f78] cursor-pointer"
            />
            <span>Include Realtime Floor Data</span>
          </label>
        </div>

        {/* System Instruction / Settings Drawer */}
        {showSettings && (
          <div className="px-4 sm:px-6 py-3 bg-[#eef3f3] border-b border-[#dceceb] text-xs space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#17343a]">Custom System Instruction:</span>
              <button
                type="button"
                onClick={() => setCustomSystemPrompt('')}
                className="text-[11px] text-[#176f78] hover:underline cursor-pointer"
              >
                Reset to Default
              </button>
            </div>
            <textarea
              value={customSystemPrompt || currentRole.systemInstruction}
              onChange={e => setCustomSystemPrompt(e.target.value)}
              rows={2}
              className="w-full p-2 rounded-xl bg-white border border-[#d9d2c2] text-[#17343a] focus:ring-1 focus:ring-[#176f78] focus:outline-hidden text-xs"
              placeholder="Define customized instructions for the chatbot persona..."
            />
            <p className="text-[10px] text-[#527078]">
              Model: <strong className="font-mono-numbers">{currentRole.model}</strong> | Telemetry:{' '}
              {includeTelemetry ? `${lines.length} lines connected` : 'Excluded'}
            </p>
          </div>
        )}

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map(msg => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[88%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs text-xs font-bold ${
                    isUser
                      ? 'bg-[#17343a] text-white'
                      : 'bg-[#176f78] text-white'
                  }`}
                  style={!isUser ? { backgroundColor: currentRole.accentColor } : {}}
                >
                  {isUser ? (
                    profile?.name ? profile.name[0].toUpperCase() : <UserIcon className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`group relative rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#176f78] text-white shadow-xs rounded-tr-xs'
                      : 'bg-white border border-[#e7e1d5] text-[#17343a] shadow-xs rounded-tl-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <span className={`text-[10px] font-bold ${isUser ? 'text-white/80' : 'text-[#527078]'}`}>
                      {isUser ? (profile?.name || 'You') : currentRole.name}
                    </span>
                    <div className="flex items-center gap-1.5 opacity-75">
                      {msg.modelUsed && !isUser && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#f1eee6] text-[#527078] font-mono-numbers">
                          {msg.modelUsed}
                        </span>
                      )}
                      <span className="text-[10px] font-mono-numbers">{msg.timestamp}</span>
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-[#527078] hover:text-[#17343a] cursor-pointer"
                          title="Copy text"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={`prose prose-xs max-w-none ${isUser ? 'text-white prose-invert' : 'text-[#17343a]'}`}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 max-w-[85%] mr-auto items-center">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs text-white"
                style={{ backgroundColor: currentRole.accentColor }}
              >
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-white border border-[#e7e1d5] rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs flex items-center gap-2 text-xs text-[#527078]">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#176f78] animate-bounce"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#176f78] animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#176f78] animate-bounce [animation-delay:0.4s]"></div>
                </div>
                <span>Analyzing garment line telemetry with {currentRole.model}...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompts */}
        {messages.length <= 2 && (
          <div className="px-4 sm:px-6 py-2 border-t border-[#e7e1d5] bg-[#fbfaf6] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold text-[#527078] uppercase tracking-wider shrink-0">
              Suggestions:
            </span>
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(q)}
                className="px-2.5 py-1 rounded-full bg-white border border-[#d9d2c2] hover:border-[#176f78] text-[#17343a] text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer shadow-2xs hover:bg-[#f1eee6]"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-[#e7e1d5] bg-white">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={`Ask ${currentRole.name} (Shift+Enter for new line)...`}
                className="w-full p-3 rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] text-xs sm:text-sm text-[#17343a] placeholder:text-[#527078]/70 focus:outline-hidden focus:border-[#176f78] focus:ring-1 focus:ring-[#176f78] resize-none max-h-32 transition-all font-sans"
              />
            </div>

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoading}
              className={`p-3 rounded-2xl flex items-center justify-center text-white transition-all cursor-pointer shadow-xs ${
                !inputText.trim() || isLoading
                  ? 'bg-[#d9d2c2] cursor-not-allowed opacity-60'
                  : 'bg-[#176f78] hover:bg-[#125860] active:scale-95'
              }`}
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] text-[#527078]">
            <span className="flex items-center gap-1 font-mono-numbers">
              <Sparkles className="w-3 h-3 text-[#176f78]" />
              Model: {currentRole.model} (Role: {currentRole.name})
            </span>
            <span>Press Enter to send</span>
          </div>
        </div>
      </div>
    </div>
  );
};
