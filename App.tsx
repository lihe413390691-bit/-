import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Message, ModelType, AgentMode, 
  // Fix: StoryboardShot is now imported from types.ts
  StoryboardShot,
  REASONING_SYSTEM_INSTRUCTION, 
  STORYBOARD_SYSTEM_INSTRUCTION, 
  VIDEO_PRODUCTION_INSTRUCTION 
} from './types';
import { sendMessageToGemini } from './services/gemini';
import ChatInput from './components/ChatInput';
import MessageList from './components/MessageList';
import StoryboardPanel from './components/StoryboardPanel';
import CinematicReasoningPanel from './components/CinematicReasoningPanel';
import SettingsModal from './components/SettingsModal';
// Fix: Removed StoryboardShot from this import as it's not exported from storyboardParser
import { parseStoryboardTable } from './utils/storyboardParser';
import { Clapperboard, Eraser, Settings2, Layout, Film, Loader2 } from 'lucide-react';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<ModelType>(ModelType.FLASH);
  const [agentMode, setAgentMode] = useState<AgentMode>(AgentMode.STORYBOARD);
  const [showLogsInStoryboard, setShowLogsInStoryboard] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [manualShots, setManualShots] = useState<StoryboardShot[]>([]);
  const [selectedStyle, setSelectedStyle] = useState('二次元动漫风格');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const showChat = (agentMode === AgentMode.STORYBOARD && showLogsInStoryboard) || (agentMode === AgentMode.CINEMATIC);

  useEffect(() => {
    if (showChat) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, showChat]);

  const currentStoryboardShots = useMemo(() => {
    const shotMap = new Map<string, StoryboardShot>();
    messages.filter(m => m.role === 'model' && !m.isThinking).forEach(msg => {
        parseStoryboardTable(msg.content).forEach(shot => {
            if (shot.id) shotMap.set(shot.id, shot);
        });
    });
    manualShots.forEach(ms => {
        const existing = shotMap.get(ms.id) || { id: ms.id, content: '', dialogue: '', visualPrompt: '' };
        shotMap.set(ms.id, { ...existing, ...ms });
    });
    return Array.from(shotMap.values()).sort((a, b) => {
        const aId = parseInt(a.id.replace(/[^\d]/g, '')) || 0;
        const bId = parseInt(b.id.replace(/[^\d]/g, '')) || 0;
        return aId - bId;
    });
  }, [messages, manualShots]);

  const handleSendMessage = async (displayText: string, hiddenContext?: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: displayText,
      hiddenContent: hiddenContext,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const tempId = (Date.now() + 1).toString();
      setMessages((prev) => [...prev, { id: tempId, role: 'model', content: '', timestamp: Date.now(), isThinking: true }]);

      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.hiddenContent || m.content }], 
      }));

      // 结合选定的风格
      const finalPrompt = agentMode === AgentMode.STORYBOARD 
        ? `【风格要求：${selectedStyle}】\n${hiddenContext || displayText}`
        : hiddenContext || displayText;

      const systemInstruction = agentMode === AgentMode.CINEMATIC ? REASONING_SYSTEM_INSTRUCTION : STORYBOARD_SYSTEM_INSTRUCTION;
      const response = await sendMessageToGemini(finalPrompt, history, model, systemInstruction, (partial) => {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, ...partial } : m));
      });

      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, content: response.content, isThinking: false } : m));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchVideoReasoning = async () => {
    if (currentStoryboardShots.length === 0) return;
    setIsLoading(true);
    try {
      const updatedShots = [...manualShots];
      for (const shot of currentStoryboardShots) {
        // 更新提示词：重点强调对话内容及语气表情的推进融入
        const prompt = `针对镜号 ${shot.id}，根据剧情【${shot.content}】、对白【${shot.dialogue}】以及视觉风格【${selectedStyle}】，重新深度推理一份完整的 15 秒奥斯卡级视频连镜脚本。重点要求：必须将【对白内容】及对白中包含的【语气表情】深度推进并融入到子镜头的具体动态描述中。要求人物动作丰富且绝对无静止状态。`;
        const response = await sendMessageToGemini(prompt, [], model, VIDEO_PRODUCTION_INSTRUCTION, () => {});
        const responseText = response.content;
        const idx = updatedShots.findIndex(s => s.id === shot.id);
        if (idx !== -1) {
          updatedShots[idx] = { ...updatedShots[idx], videoPrompt: responseText };
        } else {
          updatedShots.push({ ...shot, videoPrompt: responseText });
        }
      }
      setManualShots(updatedShots);
    } catch (error) {
      console.error("Batch reasoning failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateShot = (id: string, updates: Partial<StoryboardShot>) => {
    setManualShots(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...updates };
        return next;
      }
      return [...prev, { id, ...updates } as StoryboardShot];
    });
  };

  const handleReReasonShot = async (id: string, type: 'visual' | 'video') => {
    const shot = currentStoryboardShots.find(s => s.id === id);
    if (!shot) return;
    setIsLoading(true);
    try {
      const instruction = type === 'visual' ? STORYBOARD_SYSTEM_INSTRUCTION : VIDEO_PRODUCTION_INSTRUCTION;
      // 更新提示词：重点强调对话内容及语气表情的推进融入
      const prompt = type === 'visual' 
        ? `针对镜号 ${id} 推理极致质感的商业绘画提示词。风格：${selectedStyle}。剧情：${shot.content}` 
        : `针对镜号 ${id} 推理 15 秒奥斯卡级脚本，强制每 3-4 秒一个子动态镜。剧情：${shot.content}, 对白：${shot.dialogue}。重点要求：必须在动态描述中充分体现人物说【对白】时的具体动作、神态和【语气语气】。`;

      const response = await sendMessageToGemini(prompt, [], model, instruction, () => {});
      if (type === 'visual') {
        const parsed = parseStoryboardTable(response.content);
        const matched = parsed.find(p => p.id === id) || parsed[0];
        if (matched) handleUpdateShot(id, { visualPrompt: matched.visualPrompt });
      } else {
        handleUpdateShot(id, { videoPrompt: response.content });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-songti">
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} currentModel={model} onModelChange={setModel} />
      <header className="flex items-center justify-between px-6 py-4 bg-slate-900/80 border-b border-slate-800 z-20 shadow-2xl">
        <div className="flex bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700/50 shadow-inner">
          <button onClick={() => { setAgentMode(AgentMode.STORYBOARD); setShowLogsInStoryboard(true); }} className={`px-6 py-2 rounded-xl text-sm font-black transition-all duration-300 ${agentMode === AgentMode.STORYBOARD && showLogsInStoryboard ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>剧本分析室</button>
          <button onClick={() => { setAgentMode(AgentMode.STORYBOARD); setShowLogsInStoryboard(false); }} className={`px-6 py-2 rounded-xl text-sm font-black transition-all duration-300 ${agentMode === AgentMode.STORYBOARD && !showLogsInStoryboard ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>导演监视器</button>
          <button onClick={() => setAgentMode(AgentMode.CINEMATIC)} className={`px-6 py-2 rounded-xl text-sm font-black transition-all duration-300 ${agentMode === AgentMode.CINEMATIC ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>空景资产</button>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsSettingsOpen(true)} className="p-2.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl border border-slate-700 transition-all hover:bg-slate-700 shadow-lg"><Settings2 size={20}/></button>
          <button onClick={() => {setMessages([]); setManualShots([]);}} className="p-2.5 text-slate-400 hover:text-red-400 bg-slate-800 rounded-xl border border-slate-700 transition-all hover:bg-slate-700 shadow-lg"><Eraser size={20}/></button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        {agentMode === AgentMode.STORYBOARD && !showLogsInStoryboard ? (
            <StoryboardPanel 
              shots={currentStoryboardShots} 
              onReReason={handleReReasonShot} 
              onBatchVideoReason={handleBatchVideoReasoning} 
              onUpdateShot={handleUpdateShot} 
              isLoading={isLoading} 
            />
        ) : (
            <div className="h-full flex flex-col">
              <main className="flex-1 overflow-y-auto p-4 md:p-12 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                <div className="max-w-5xl mx-auto space-y-8">
                    {messages.length === 0 ? (
                        <div className="text-center py-40 opacity-30 select-none">
                            <Clapperboard size={120} className="mx-auto mb-8 text-indigo-500 animate-pulse" />
                            <h2 className="text-3xl font-black tracking-tighter text-slate-100">AI 商业动画导演系统</h2>
                            <p className="mt-4 text-xl font-light text-slate-400">注入您的剧本灵感，开始奥斯卡级视听推理 (每次最少产出24镜)</p>
                        </div>
                    ) : (
                        <MessageList messages={messages} />
                    )}
                    <div ref={messagesEndRef} />
                </div>
              </main>
              <div className="p-8 bg-slate-900/80 border-t border-slate-800 backdrop-blur-xl shadow-[0_-10px_50px_rgba(0,0,0,0.5)]">
                <div className="max-w-4xl mx-auto">
                    <ChatInput onSend={handleSendMessage} disabled={isLoading} style={selectedStyle} onStyleChange={setSelectedStyle} />
                </div>
              </div>
            </div>
        )}
      </div>
    </div>
  );
}
