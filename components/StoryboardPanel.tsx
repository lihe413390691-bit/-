
import React, { useState } from 'react';
import { StoryboardShot } from '../types';
import { 
  Clapperboard, Video, Mic, ImageIcon, Copy, RefreshCw, 
  Check, Loader2, Layout, FileText, Sparkles, Edit3, Save, Play,
  FileDown, FileType
} from 'lucide-react';

interface StoryboardPanelProps {
  shots: StoryboardShot[];
  onReReason: (id: string, type: 'visual' | 'video') => void;
  onBatchVideoReason: () => void;
  onUpdateShot: (id: string, updates: Partial<StoryboardShot>) => void;
  isLoading?: boolean;
}

export default function StoryboardPanel({ 
  shots, 
  onReReason, 
  onBatchVideoReason, 
  onUpdateShot, 
  isLoading = false 
}: StoryboardPanelProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [editing, setEditing] = useState<{id: string, type: 'visual' | 'video', value: string} | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveEdit = () => {
    if (editing) {
      onUpdateShot(editing.id, { 
        [editing.type === 'visual' ? 'visualPrompt' : 'videoPrompt']: editing.value 
      });
      setEditing(null);
    }
  };

  const cleanTextForExport = (text: string) => {
    return (text || '').replace(/<br\s*\/?>/gi, ' ').replace(/\n/g, ' ').replace(/\|/g, '\\|').trim();
  };

  const exportShots = (format: 'txt' | 'docx') => {
    if (shots.length === 0) return;

    if (format === 'txt') {
      let content = `|镜头|时长|剧情|对话内容|绘画提示词|动画提示词|环境声音|\n`;
      content += `|---|---|---|---|---|---|---|\n`;

      shots.forEach(shot => {
        const row = [
          shot.id,
          shot.duration || '15s',
          cleanTextForExport(shot.content),
          cleanTextForExport(shot.dialogue),
          cleanTextForExport(shot.visualPrompt),
          cleanTextForExport(shot.videoPrompt || ''),
          cleanTextForExport(shot.environmentSound || '')
        ];
        content += `|${row.join('|')}|\n`;
      });

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `分镜脚本表格_${new Date().getTime()}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Storyboard</title></head>
        <body style="font-family: 'SimSun', serif;">
          <h1 style="text-align: center;">AI 商业动画分镜脚本汇总</h1>
          ${shots.map(shot => `
            <div style="margin-bottom: 40px; border-bottom: 1px solid #ccc; padding-bottom: 20px;">
              <h2 style="color: #4f46e5;">镜号: ${shot.id} [${shot.sceneGroup || '主场景'}]</h2>
              <p><b>时长:</b> ${shot.duration || '15s'}</p>
              <p><b>剧情:</b> ${shot.content}</p>
              <p><b>对话:</b> ${shot.dialogue}</p>
              <p><b>绘画提示词:</b> ${shot.visualPrompt}</p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
                <p><b>奥斯卡级脚本:</b></p>
                <pre style="white-space: pre-wrap;">${(shot.videoPrompt || '').replace(/<br\s*\/?>/gi, '\n').replace(/▲/g, '\n▲')}</pre>
              </div>
              <p><b>环境声音:</b> ${shot.environmentSound || '无'}</p>
            </div>
          `).join('')}
        </body>
        </html>
      `;
      const blob = new Blob([htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `分镜脚本_${new Date().getTime()}.doc`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const renderVideoPrompt = (text: string) => {
    if (!text) return null;
    
    const cleanText = text
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?[^>]+(>|$)/g, "")
      .replace(/\[|\]/g, '');
      
    const parts = cleanText.split('▲');
    
    return (
      <div className="space-y-4 font-songti">
        {parts.map((part, i) => {
          const content = part.trim();
          if (!content) return null;
          
          return (
            <div key={i} className={`relative pl-8 ${i > 0 ? 'mt-3 border-t border-indigo-500/10 pt-3' : ''}`}>
               {i > 0 ? (
                 <span className="absolute left-0 top-3 text-indigo-500 font-black text-lg">▲</span>
               ) : (
                 <div className="mb-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-slate-800 pb-1">
                   {content.includes('【') ? content.split('\n')[0] : '奥斯卡级深度调度'}
                 </div>
               )}
               <p className="text-[14px] leading-[1.8] text-indigo-100/90 tracking-wide font-songti">
                 {i === 0 && content.includes('】') ? content.substring(content.indexOf('】') + 1).trim() : content}
               </p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-950 text-slate-100 overflow-hidden font-songti">
      {/* 顶栏 */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 flex justify-between items-center z-10 shadow-xl">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-lg shadow-inner"><Layout size={20} className="text-indigo-400"/></div>
              <div>
                <h3 className="font-bold text-slate-200 tracking-tight text-lg">商业动画·奥斯卡导演监视中心</h3>
                <p className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  镜头序列: {shots.length} | 模式: 深度脚本分析
                </p>
              </div>
          </div>

          <div className="flex items-center gap-4">
              <div className="flex bg-slate-800/60 p-1 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
                  <button 
                    onClick={() => exportShots('txt')}
                    disabled={shots.length === 0}
                    className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-700 transition-all disabled:opacity-30"
                    title="下载 Markdown 表格 TXT"
                  >
                    <FileDown size={14} />
                    <span>TXT 表格</span>
                  </button>
                  <div className="w-px h-4 bg-slate-700 my-auto"></div>
                  <button 
                    onClick={() => exportShots('docx')}
                    disabled={shots.length === 0}
                    className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-700 transition-all disabled:opacity-30"
                  >
                    <FileType size={14} />
                    <span>DOCX</span>
                  </button>
              </div>

              <button 
                onClick={onBatchVideoReason}
                disabled={isLoading || shots.length === 0}
                className="flex items-center gap-2 px-8 py-2.5 rounded-2xl text-sm font-black bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 hover:from-indigo-500 hover:to-purple-700 text-white shadow-2xl shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                <span>全篇奥斯卡级深度推理</span>
              </button>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')]">
        {shots.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-20">
                <Clapperboard size={100} className="mb-6 text-slate-700" />
                <p className="text-2xl font-black tracking-widest uppercase">Sequence Standby</p>
            </div>
        ) : (
            shots.map((shot) => (
                <div key={shot.id} className="flex flex-col lg:flex-row border border-slate-800 bg-slate-900/40 rounded-[2.5rem] overflow-hidden group hover:border-indigo-500/40 hover:shadow-[0_0_60px_rgba(79,70,229,0.12)] transition-all duration-700 ease-out">
                    
                    <div className="lg:w-80 p-8 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950/40">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="px-5 py-1.5 bg-indigo-500/10 text-indigo-400 text-xs font-black rounded-full border border-indigo-500/20 tracking-tighter shadow-sm">
                              SHOT-{shot.id}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="px-3 py-1.5 bg-slate-800/80 text-slate-200 text-[11px] font-black rounded-lg border border-slate-700/50 truncate shadow-inner flex items-center gap-2" title={shot.sceneGroup}>
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                  <span className="truncate uppercase tracking-wider">{shot.sceneGroup || '主场景'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-8">
                            <div>
                                <p className="text-[10px] font-black text-slate-600 uppercase mb-3 tracking-[0.3em] flex items-center gap-2">
                                  <FileText size={14} className="opacity-50"/> 剧本逻辑
                                </p>
                                <p className="text-[15px] text-slate-200 leading-relaxed font-songti text-justify indent-4">{shot.content}</p>
                            </div>
                            <div className="p-4 bg-emerald-500/[0.03] rounded-2xl border border-emerald-500/10">
                                <p className="text-[10px] font-black text-emerald-600/60 uppercase mb-3 tracking-[0.3em] flex items-center gap-2">
                                  <Mic size={14} className="opacity-50"/> 交互台词
                                </p>
                                <p className="text-[14px] text-emerald-400 font-songti italic leading-relaxed text-center">
                                  {shot.dialogue && shot.dialogue !== '（无）' ? `“${shot.dialogue}”` : '— 沉默调度 —'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 p-8 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/10">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2 text-amber-600/80">
                                <ImageIcon size={20} />
                                <span className="text-[11px] font-black uppercase tracking-[0.2em]">视觉概念 (CONCEPTUAL VISUALS)</span>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500">
                                <button onClick={() => setEditing({id: shot.id, type: 'visual', value: shot.visualPrompt})} className="p-2.5 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-colors"><Edit3 size={16}/></button>
                                <button onClick={() => onReReason(shot.id, 'visual')} className="p-2.5 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-colors"><RefreshCw size={16}/></button>
                                <button onClick={() => handleCopy(shot.visualPrompt, `${shot.id}-vis`)} className="p-2.5 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-colors">
                                    {copiedKey === `${shot.id}-vis` ? <Check size={16} className="text-green-500"/> : <Copy size={16}/>}
                                </button>
                            </div>
                        </div>
                        {editing?.id === shot.id && editing.type === 'visual' ? (
                            <div className="space-y-4">
                                <textarea 
                                    value={editing.value} 
                                    onChange={(e) => setEditing({...editing, value: e.target.value})}
                                    className="w-full h-44 bg-slate-950 border-2 border-indigo-500/50 rounded-2xl p-5 text-sm text-slate-100 outline-none font-songti shadow-2xl"
                                />
                                <div className="flex justify-end gap-3">
                                    <button onClick={() => setEditing(null)} className="px-4 py-2 text-xs text-slate-500 font-bold hover:text-white">取消</button>
                                    <button onClick={handleSaveEdit} className="px-5 py-2 text-xs bg-indigo-600 text-white rounded-xl font-black">确认修改</button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-black/40 rounded-[2rem] p-8 border border-slate-800/40 min-h-[180px] flex items-center shadow-inner">
                                <p className="text-[16px] text-slate-400 font-songti leading-[1.9] text-justify select-all italic tracking-wide">
                                  {shot.visualPrompt}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 p-8 bg-indigo-600/[0.02] relative">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2 text-indigo-400">
                                <Play size={20} />
                                <span className="text-[11px] font-black uppercase tracking-[0.2em]">奥斯卡调度 (DYNAMIC OSCAR SCRIPT)</span>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500">
                                {shot.videoPrompt && (
                                    <>
                                        <button onClick={() => setEditing({id: shot.id, type: 'video', value: shot.videoPrompt!})} className="p-2.5 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-colors"><Edit3 size={16}/></button>
                                        <button onClick={() => onReReason(shot.id, 'video')} className="p-2.5 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-colors"><RefreshCw size={16}/></button>
                                        <button onClick={() => handleCopy(shot.videoPrompt!, `${shot.id}-vid`)} className="p-2.5 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-colors">
                                            {copiedKey === `${shot.id}-vid` ? <Check size={16} className="text-green-500"/> : <Copy size={16}/>}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        {editing?.id === shot.id && editing.type === 'video' ? (
                            <div className="space-y-4">
                                <textarea 
                                    value={editing.value} 
                                    onChange={(e) => setEditing({...editing, value: e.target.value})}
                                    className="w-full h-44 bg-slate-950 border-2 border-purple-500/50 rounded-2xl p-5 text-sm text-slate-100 outline-none font-songti shadow-2xl"
                                />
                                <div className="flex justify-end gap-3">
                                    <button onClick={() => setEditing(null)} className="px-4 py-2 text-xs text-slate-500 font-bold">取消</button>
                                    <button onClick={handleSaveEdit} className="px-5 py-2 text-xs bg-purple-600 text-white rounded-xl font-black">保存修改</button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-indigo-950/10 rounded-[2rem] p-8 border border-indigo-500/10 min-h-[180px] shadow-sm">
                                {shot.videoPrompt ? (
                                    renderVideoPrompt(shot.videoPrompt)
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-4">
                                        <Sparkles size={32} className="opacity-20 text-indigo-400" />
                                        <button 
                                            onClick={() => onReReason(shot.id, 'video')}
                                            className="text-sm font-black text-indigo-400 hover:text-indigo-300 transition-all underline decoration-dotted"
                                        >
                                            生成奥斯卡脚本
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="lg:w-28 flex flex-row lg:flex-col items-center justify-center p-6 bg-slate-950/80 border-t lg:border-t-0 lg:border-l border-slate-800 gap-6">
                        <button className="w-16 h-16 bg-gradient-to-tr from-indigo-700 to-indigo-500 rounded-3xl hover:shadow-[0_0_40px_rgba(79,70,229,0.3)] text-white transition-all active:scale-90 flex items-center justify-center group/play border border-indigo-400/20 shadow-2xl">
                            <Video size={28} className="group-hover/play:scale-125 transition-transform duration-500 ease-out"/>
                        </button>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
}
