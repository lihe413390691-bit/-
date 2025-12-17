import React, { useState } from 'react';
import { Sparkles, ArrowRight, Copy, Check, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// Fix: Removed import of StoryboardShot from parser as it is not exported there
// Fix: Import StoryboardShot, REASONING_SYSTEM_INSTRUCTION, and ModelType from types.ts
import { StoryboardShot, REASONING_SYSTEM_INSTRUCTION, ModelType } from '../types';
import { sendMessageToGemini } from '../services/gemini';

interface CinematicReasoningPanelProps {
  shots: StoryboardShot[];
  model?: ModelType;
  savedReport?: string;
  onReportUpdate?: (report: string) => void;
}

// Helper component for Code Block with Copy
const CodeBlockWithCopy = ({ children, className, ...props }: any) => {
    const [copied, setCopied] = useState(false);
    const textContent = String(children).replace(/\n$/, '');

    const handleCopy = () => {
        navigator.clipboard.writeText(textContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // If it's inline code, just render span
    const match = /language-(\w+)/.exec(className || '');
    if (!match && !textContent.includes('\n') && textContent.length < 50) {
        return <code className="px-1.5 py-0.5 rounded-md bg-slate-900/50 text-slate-300 font-mono text-xs border border-slate-700/50" {...props}>{children}</code>;
    }

    return (
        <div className="relative group my-4 rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800">
                <span className="text-xs text-slate-500 font-mono uppercase">
                    {match ? match[1] : 'Prompt / Text'}
                </span>
                <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                    {copied ? (
                        <>
                            <Check size={12} className="text-emerald-500" />
                            <span className="text-emerald-500">已复制</span>
                        </>
                    ) : (
                        <>
                            <Copy size={12} />
                            <span>复制</span>
                        </>
                    )}
                </button>
            </div>
            <div className="p-4 overflow-x-auto text-sm font-mono text-slate-300 bg-black/20">
                <code className={className} {...props}>
                    {children}
                </code>
            </div>
        </div>
    );
};

export default function CinematicReasoningPanel({ 
  shots, 
  model = ModelType.FLASH, 
  savedReport = '', 
  onReportUpdate 
}: CinematicReasoningPanelProps) {
  const [isReasoning, setIsReasoning] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(savedReport);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleReasoning = async () => {
    if (!shots || shots.length === 0) {
      alert("未检测到分镜数据，请先在【分镜大师】中生成内容。");
      return;
    }

    setIsReasoning(true);
    if (onReportUpdate) onReportUpdate(''); // Clear previous results using parent setter

    try {
      // 1. Serialize shots to a readable format for the LLM
      // We explicitly mention these are from the "Storyboard Master"
      const shotsContext = shots.map(s => 
        `| 镜号: ${s.id} | 场景组: ${s.sceneGroup || '无'} | 剧情: ${s.content} | 原画面提示: ${s.visualPrompt} |`
      ).join('\n');

      const prompt = `
【全剧分镜数据】
以下是分镜大师生成的完整剧本信息与画面提示词：
${shotsContext}

【执行指令】
请根据上述信息，严格按照 System Instruction 的要求（自动聚合场景、推断镜头范围、深度视觉化推理、生成Copy Box），输出《空景图汇报告》。
`;

      // 2. Call Gemini
      await sendMessageToGemini(
        prompt,
        [], 
        model, 
        REASONING_SYSTEM_INSTRUCTION, // Fix: Use the correctly imported constant
        (partialUpdate) => {
           // Streaming hooks could go here if supported by parent logic
        }
      ).then(response => {
          if (onReportUpdate) onReportUpdate(response.content);
      });

    } catch (error) {
      console.error("Reasoning failed:", error);
      if (onReportUpdate) onReportUpdate("生成报告时发生错误，请检查网络设置或重试。");
    } finally {
      setIsReasoning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 overflow-y-auto custom-scrollbar">
      
      <div className="max-w-5xl mx-auto w-full space-y-8 pb-10">
        
        {/* Header Section */}
        <div className="text-center space-y-4 animate-in fade-in slide-in-from-top-4">
          <div className="inline-flex items-center justify-center p-3 bg-purple-500/10 rounded-full mb-2 ring-1 ring-purple-500/30">
            <Sparkles size={32} className="text-purple-400" />
          </div>
          <h2 className="text-3xl font-bold text-slate-100 tracking-tight">场景分镜助手</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            基于分镜大师的数据，智能聚合大场景，自动推断多镜头视角，生成可一键复制的空景资产清单。
          </p>
          
          {/* Main Action Button */}
          <div className="flex flex-col items-center gap-3">
            <button
                onClick={handleReasoning}
                disabled={isReasoning}
                className={`
                relative group overflow-hidden px-8 py-4 rounded-xl font-bold text-lg shadow-2xl transition-all duration-300
                ${isReasoning 
                    ? 'bg-slate-800 text-slate-500 cursor-wait' 
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white hover:shadow-purple-500/25 hover:scale-[1.02]'
                }
                `}
            >
                <div className="flex items-center gap-3">
                {isReasoning ? (
                    <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>正在聚合场景并推理视角...</span>
                    </>
                ) : (
                    <>
                    <FileText size={20} className="group-hover:rotate-12 transition-transform" />
                    <span>生成空景资产汇总报告</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                )}
                </div>
            </button>
            
            {shots.length > 0 && (
                <p className="text-xs text-slate-500 font-mono">
                数据源: {shots.length} 个分镜镜头 | 增强模型: {model}
                </p>
            )}
          </div>
        </div>

        {/* Results Area */}
        {savedReport && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                 <span className="text-sm font-bold text-purple-400 uppercase tracking-wider">生成报告 (资产清单)</span>
              </div>
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors border border-slate-700"
              >
                {isCopied ? <Check size={14} className="text-emerald-500"/> : <Copy size={14}/>}
                <span>{isCopied ? '已复制' : '复制全文'}</span>
              </button>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 md:p-8 shadow-inner">
               <article className="prose prose-invert prose-sm md:prose-base max-w-none prose-headings:text-purple-200 prose-a:text-purple-400 prose-strong:text-purple-100">
                 <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                        code: CodeBlockWithCopy,
                        h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-indigo-200" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-xl font-bold border-l-4 border-purple-500 pl-3 mt-8 mb-4 bg-purple-900/10 py-1" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-indigo-200 mt-6 mb-2 border-b border-indigo-500/20 pb-1" {...props} />,
                        li: ({node, ...props}) => <li className="my-1 marker:text-purple-500" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold text-white bg-slate-800/80 px-1.5 rounded text-indigo-200 border border-indigo-500/20" {...props} />
                    }}
                 >
                    {savedReport}
                 </ReactMarkdown>
               </article>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
