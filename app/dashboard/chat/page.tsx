'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles, 
  Building2, 
  DollarSign, 
  Hammer, 
  Truck, 
  Clock 
} from 'lucide-react';
import FormattedMessage from '@/components/FormattedMessage';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Project {
  id: string;
  name: string;
}

const QUICK_PROMPTS = [
  { label: '📊 Site Overview', query: 'What is the current overview and status of my projects?' },
  { label: '💰 Budget & Expenses', query: 'Summarize our total budget, spent amount, and remaining funds.' },
  { label: '🧱 Material Takeoff', query: 'What are the required quantities for cement, steel, and sand?' },
  { label: '🏗️ Required Equipment', query: 'List all required civil machinery and equipment with duration.' },
  { label: '⏱️ Timeline & Milestones', query: 'What are the current phase milestones and upcoming task due dates?' },
];

export default function ChatPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Hello! I am BuildSmart AI, your civil engineering consultant and project assistant. Ask me anything about your site overviews, estimates, material takeoff, budgets, equipment, or schedule milestones.',
    },
  ]);
  const [input, setInput] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch('/api/projects');
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
        }
      } catch (err) {
        console.error('Failed to load projects:', err);
      }
    }
    loadProjects();
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSendMessage(messageText: string) {
    if (!messageText.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: messageText.trim() };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          projectId: selectedProject,
        }),
      });

      const data = await res.json();

      let replyContent = data.reply;
      if (!replyContent && data.error) {
        try {
          const parsed = typeof data.error === 'string' ? JSON.parse(data.error) : data.error;
          replyContent = parsed.error?.message || parsed.message || data.error;
        } catch {
          replyContent = data.error;
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: replyContent || 'I am ready to assist with your project details.',
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Unable to connect to the assistant service. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSendMessage(input);
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] max-w-5xl mx-auto flex-col p-4 text-paper">
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-blueprint-line pb-3 shrink-0">
        <div>
          <h1 className="font-display text-2xl font-bold text-paper flex items-center gap-2">
            <Bot className="text-signal-teal" size={24} /> AI Assistant
          </h1>
          <p className="text-xs text-signal-slate mt-0.5">
            Scope answers to a single project or query across all sites.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-signal-slate">Project Scope:</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="rounded-md border border-blueprint-line bg-navy-800 px-3 py-1.5 text-xs text-paper focus:border-signal-teal focus:outline-none"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Prompt Chips */}
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1 shrink-0">
        {QUICK_PROMPTS.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(qp.query)}
            disabled={loading}
            className="whitespace-nowrap rounded-lg border border-blueprint-line bg-navy-900 px-3 py-1.5 text-[11px] font-medium text-signal-slate transition hover:border-signal-teal hover:bg-signal-teal/10 hover:text-signal-teal disabled:opacity-50"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Message Feed */}
      <div className="flex-1 min-h-0 space-y-4 overflow-y-auto rounded-xl border border-blueprint-line bg-navy-900/40 p-4 md:p-6 shadow-inner">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${
              m.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {m.role === 'assistant' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-signal-teal/15 text-signal-teal">
                <Bot size={18} />
              </div>
            )}

            <div
              className={`max-w-[88%] rounded-xl p-4 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-signal-teal font-medium text-navy-950'
                  : 'border border-blueprint-line bg-navy-800 text-paper shadow-sm'
              }`}
            >
              <FormattedMessage content={m.content} isUser={m.role === 'user'} />
            </div>

            {m.role === 'user' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-700 text-paper">
                <User size={18} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-signal-slate pl-1">
            <Loader2 size={16} className="animate-spin text-signal-teal" />
            BuildSmart AI is analyzing project database...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything (e.g. 'What is current overview?' or 'Show me material takeoff')..."
          className="flex-1 rounded-lg border border-blueprint-line bg-navy-800 px-4 py-3 text-sm text-paper placeholder:text-signal-slate/50 focus:border-signal-teal focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex items-center justify-center rounded-lg bg-signal-teal px-5 py-3 text-navy-950 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
}