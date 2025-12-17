
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Paperclip, Palette, Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => void;
  onFileUpload?: (file: File) => void;
  disabled: boolean;
  style?: string;
  onStyleChange?: (style: string) => void;
}

export default function ChatInput({ onSend, onFileUpload, disabled, style, onStyleChange }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stylePresets = [
    "二次元动漫风格",
    "写实电影风格",
    "水墨武侠风格",
    "赛博朋克风格",
    "皮克斯3D风格"
  ];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Style Selection Component */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/50 p-3 rounded-2xl border border-slate-800/50 backdrop-blur-md">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
          <Palette size={14} />
          <span className="text-[10px] font-black uppercase tracking-wider">画面风格定制</span>
        </div>
        <div className="flex flex-wrap gap-2 flex-1">
          {stylePresets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onStyleChange?.(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                style === p 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'bg-slate-800 text-slate-400 hover:text-slate-300'
              }`}
            >
              {p}
            </button>
          ))}
          <input 
            type="text" 
            value={style} 
            onChange={(e) => onStyleChange?.(e.target.value)}
            placeholder="自定义风格描述..."
            className="flex-1 min-w-[150px] bg-slate-950/50 border border-slate-700/50 rounded-lg px-3 py-1 text-xs text-slate-200 outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>
      </div>

      <div className="relative group">
         {/* Glow Effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        
        <div className="relative flex items-end gap-2 bg-slate-900 border border-slate-700 rounded-xl p-2 shadow-2xl">
          
          {/* Upload Button */}
          <div className="pb-1 pl-1">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".txt,.docx"
              className="hidden"
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors flex flex-col items-center justify-center group/upload"
              title="上传剧本 (txt/docx)"
            >
              <Paperclip size={20} className="group-hover/upload:rotate-45 transition-transform duration-300" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder="输入剧本内容，点击右侧或上传文件开始推理..."
              className="flex-1 max-h-[200px] min-h-[44px] py-2.5 px-3 bg-transparent text-sm md:text-base text-slate-100 placeholder-slate-500 focus:outline-none resize-none font-sans"
              rows={1}
            />
            <button
              type="submit"
              disabled={disabled || !input.trim()}
              className={`flex items-center justify-center w-10 h-10 mb-1 rounded-lg transition-all duration-200 ${
                disabled || !input.trim()
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
              }`}
            >
              {disabled ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
