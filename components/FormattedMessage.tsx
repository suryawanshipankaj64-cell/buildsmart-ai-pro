'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FormattedMessageProps {
  content: string;
  isUser?: boolean;
}

export default function FormattedMessage({ content, isUser = false }: FormattedMessageProps) {
  if (isUser) {
    return <div className="whitespace-pre-wrap font-medium">{content}</div>;
  }

  return (
    <div className="prose-blueprint max-w-none text-xs text-paper leading-relaxed space-y-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-base font-bold text-paper border-b border-blueprint-line/70 pb-1.5 mt-3 mb-2 flex items-center gap-1.5 font-display">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold text-paper border-b border-blueprint-line/50 pb-1 mt-3 mb-2 flex items-center gap-1.5 font-display">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-bold text-signal-teal mt-2.5 mb-1.5 flex items-center gap-1 font-mono tracking-wide uppercase">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-semibold text-paper mt-2 mb-1">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="my-1 text-xs leading-relaxed text-paper/95">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="my-2 space-y-1.5 pl-4 list-disc marker:text-signal-teal text-xs text-paper/90">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 space-y-1.5 pl-4 list-decimal marker:text-signal-teal text-xs text-paper/90 font-mono">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-paper underline-offset-2">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-signal-slate font-sans">{children}</em>
          ),
          hr: () => (
            <hr className="my-3 border-blueprint-line/60" />
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-2 border-signal-teal bg-navy-950/70 py-1 px-3 rounded-r text-signal-slate italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-3 w-full overflow-x-auto rounded-lg border border-blueprint-line bg-navy-950/80 shadow-md">
              <table className="w-full text-left border-collapse text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-blueprint-line bg-navy-900 text-signal-teal font-mono uppercase tracking-wider text-[10px]">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-blueprint-line/40 font-sans text-xs">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-navy-800/60 transition-colors">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2.5 font-bold text-signal-teal whitespace-nowrap">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-paper whitespace-nowrap font-mono text-[11px]">
              {children}
            </td>
          ),
          code: ({ children }) => (
            <code className="rounded bg-navy-950 px-1.5 py-0.5 font-mono text-[11px] text-signal-teal border border-blueprint-line">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="my-2 overflow-x-auto rounded-lg border border-blueprint-line bg-navy-950 p-3 font-mono text-[11px] text-signal-teal">
              {children}
            </pre>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

