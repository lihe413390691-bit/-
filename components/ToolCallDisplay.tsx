
import React from 'react';
import { Calculator, Check, Terminal, Loader2, Image as ImageIcon } from 'lucide-react';
import { ToolCall } from '../types';

interface ToolCallDisplayProps {
  toolCalls: ToolCall[];
}

export default function ToolCallDisplay({ toolCalls }: ToolCallDisplayProps) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="space-y-4 my-4">
      {toolCalls.map((call) => (
        <div 
          key={call.id} 
          className="flex flex-col bg-slate-900/50 border border-slate-800 rounded-md overflow-hidden font-mono"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50 border-b border-slate-800 text-xs">
            <div className="flex items-center space-x-2 text-indigo-300">
              {call.name === 'calculator' && <Calculator size={14} />}
              {call.name === 'generate_image' && <ImageIcon size={14} />}
              {call.name !== 'calculator' && call.name !== 'generate_image' && <Terminal size={14} />}
              <span className="font-semibold uppercase tracking-wider">
                {call.name === 'calculator' ? '计算工具' : call.name === 'generate_image' ? 'AI 绘图工具' : call.name}
              </span>
            </div>
            <div className="text-slate-500 flex items-center gap-1">
               {call.result ? (
                 <>
                   <span className="text-[10px]">完成</span>
                   <Check size={14} className="text-green-500"/>
                 </>
               ) : (
                 <>
                   <span className="text-[10px]">运行中</span>
                   <Loader2 size={14} className="animate-spin"/>
                 </>
               )}
            </div>
          </div>

          {/* Body */}
          <div className="p-3 space-y-3">
            {/* Arguments */}
            <div className="flex gap-2 text-xs text-slate-300">
               <span className="text-slate-500 select-none">输入 {'>'}</span>
               <span className="break-words w-full opacity-80">{JSON.stringify(call.args)}</span>
            </div>
            
            {/* Generated Image */}
            {call.generatedImage && (
              <div className="mt-2 rounded-lg overflow-hidden border border-slate-700/50 shadow-lg relative group">
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  预览图
                </div>
                <img 
                  src={`data:image/png;base64,${call.generatedImage}`} 
                  alt="Generated content" 
                  className="w-full h-auto object-cover max-h-[400px]" 
                />
              </div>
            )}

            {/* Result Text (only if not an image or if error) */}
            {call.result && !call.generatedImage && (
               <div className="flex gap-2 text-emerald-400 text-xs">
                 <span className="text-slate-500 select-none">输出 {'='}</span>
                 <span className="break-all">{call.result}</span>
               </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
