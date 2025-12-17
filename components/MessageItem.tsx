import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';
import ToolCallDisplay from './ToolCallDisplay';
import { User, Bot, ExternalLink, Globe } from 'lucide-react';

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
      return (
          <div className="flex justify-center my-4">
              <span className="px-3 py-1 bg-red-900/20 text-red-400 text-xs rounded-full border border-red-900/50">
                  {message.content}
              </span>
          </div>
      )
  }

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[95%] md:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3 md:gap-4`}>
        
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center 
          ${isUser ? 'bg-indigo-600' : 'bg-cyan-700'}
          shadow-lg
        `}>
          {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col w-full min-w-0`}>
           <div className={`
             relative px-4 py-3 rounded-2xl shadow-sm
             ${isUser 
               ? 'bg-indigo-600 text-white rounded-tr-none' 
               : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'
             }
           `}>
              {/* Tool Calls Visualization */}
              {message.toolCalls && message.toolCalls.length > 0 && (
                <div className="mb-4">
                  <ToolCallDisplay toolCalls={message.toolCalls} />
                </div>
              )}

              {/* Text Content */}
              {message.content ? (
                <div className={`prose prose-invert max-w-none text-sm md:text-base leading-relaxed ${isUser ? 'prose-p:text-white' : ''}`}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline ? (
                          <div className="relative my-4 rounded-md overflow-hidden bg-slate-950 border border-slate-800">
                             <div className="flex items-center px-3 py-1 bg-slate-900/50 border-b border-slate-800 text-xs text-slate-500 font-mono">
                                {match ? match[1] : 'code'}
                             </div>
                             <div className="p-3 overflow-x-auto">
                                <code className={className} {...props}>
                                  {children}
                                </code>
                             </div>
                          </div>
                        ) : (
                          <code className="px-1.5 py-0.5 rounded-md bg-slate-900/50 text-slate-300 font-mono text-xs border border-slate-700/50" {...props}>
                            {children}
                          </code>
                        );
                      },
                      // Custom Table Styling for Storyboards
                      table({ children }: any) {
                        return (
                          <div className="overflow-x-auto my-4 rounded-lg border border-slate-700 shadow-sm">
                            <table className="min-w-full divide-y divide-slate-700 bg-slate-900/50 text-left text-sm">
                              {children}
                            </table>
                          </div>
                        );
                      },
                      thead({ children }: any) {
                        return <thead className="bg-slate-800 text-xs uppercase text-slate-400 font-medium">{children}</thead>;
                      },
                      th({ children }: any) {
                        return <th scope="col" className="px-4 py-3 whitespace-nowrap">{children}</th>;
                      },
                      td({ children }: any) {
                         return <td className="px-4 py-3 border-t border-slate-800 text-slate-300 whitespace-pre-wrap">{children}</td>;
                      },
                      tr({ children }: any) {
                         return <tr className="hover:bg-slate-800/30 transition-colors">{children}</tr>;
                      }
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                message.isThinking && (
                  <div className="flex items-center space-x-2 h-6">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  </div>
                )
              )}

              {/* Grounding Sources */}
              {message.groundingMetadata?.groundingChunks && (
                <div className="mt-4 pt-3 border-t border-slate-700/50">
                  <div className="flex flex-wrap gap-2">
                    {message.groundingMetadata.groundingChunks.map((chunk, idx) => {
                      if (chunk.web) {
                        return (
                          <a 
                            key={idx}
                            href={chunk.web.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-900/50 hover:bg-slate-900 text-xs text-indigo-400 hover:text-indigo-300 transition-colors border border-slate-700/50"
                          >
                            <Globe size={10} />
                            <span className="truncate max-w-[150px]">{chunk.web.title}</span>
                            <ExternalLink size={10} />
                          </a>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}
           </div>
           
           {/* Timestamp / Role label */}
           <div className={`flex mt-1 text-[10px] text-slate-500 font-medium ${isUser ? 'justify-end pr-1' : 'justify-start pl-1'}`}>
              {isUser ? 'You' : 'Reasoning Agent'} • {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
           </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;