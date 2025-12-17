import React, { useState } from 'react';
import { Settings2, X, Globe, Zap, Server, CheckCircle2, AlertCircle, Loader2, Link, ToggleLeft, ToggleRight, Key } from 'lucide-react';
import { ModelType } from '../types';
import { testGeminiConnection } from '../services/gemini';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentModel: ModelType;
  onModelChange: (model: ModelType) => void;
}

export default function SettingsModal({ isOpen, onClose, currentModel, onModelChange }: SettingsModalProps) {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [proxyUrl, setProxyUrl] = useState('');
  const [proxyKey, setProxyKey] = useState('');
  const [isCompatibilityMode, setIsCompatibilityMode] = useState(false);

  const handleSave = () => {
    // 这里可以将配置持久化到 localStorage 或应用状态中
    onClose();
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    const result = await testGeminiConnection();
    if (result.success) {
      setTestStatus('success');
      setTestMessage(result.message);
    } else {
      setTestStatus('error');
      setTestMessage(result.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/50 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white">
            <Settings2 size={20} className="text-indigo-400" />
            <h2 className="text-lg font-bold tracking-tight text-white font-songti">配置与模型 (Settings)</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* Model Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">选择模型 (MODEL)</label>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => onModelChange(ModelType.FLASH)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${currentModel === ModelType.FLASH ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
              >
                <Zap size={20} className="mb-1" />
                <span className="text-xs font-bold">Flash</span>
              </button>
              <button 
                onClick={() => onModelChange(ModelType.PRO)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${currentModel === ModelType.PRO ? 'bg-purple-600/20 border-purple-500 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
              >
                <Server size={20} className="mb-1" />
                <span className="text-xs font-bold">Pro</span>
              </button>
              <button 
                onClick={() => onModelChange(ModelType.DOUBAO)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${currentModel === ModelType.DOUBAO ? 'bg-emerald-600/20 border-emerald-500 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
              >
                <Globe size={20} className="mb-1" />
                <span className="text-xs font-bold">Doubao</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-800" />

          {/* Third-party API Configuration */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Link size={14} className="text-indigo-400"/> 第三方链接 API 接口
            </label>
            <div className="space-y-3">
              <div className="relative">
                <input 
                  type="text" 
                  value={proxyUrl}
                  onChange={(e) => setProxyUrl(e.target.value)}
                  placeholder="输入 API 地址 (例如: https://api.proxy.com/v1)"
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors shadow-inner"
                />
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Key size={14} />
                </div>
                <input 
                  type="password" 
                  value={proxyKey}
                  onChange={(e) => setProxyKey(e.target.value)}
                  placeholder="输入第三方 API 密钥 (Key)"
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors shadow-inner"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950/30 rounded-xl border border-slate-800">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-300">中转 / 兼容按钮</span>
                  <span className="text-[9px] text-slate-500">开启以提升跨境/代理连接稳定性</span>
                </div>
                <button 
                  onClick={() => setIsCompatibilityMode(!isCompatibilityMode)}
                  className={`transition-colors ${isCompatibilityMode ? 'text-indigo-400' : 'text-slate-600'}`}
                >
                  {isCompatibilityMode ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                </button>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-800" />

          {/* Test Connection */}
          <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 flex items-center justify-between">
             <div className="flex items-center gap-2">
                {testStatus === 'idle' && <span className="w-2 h-2 rounded-full bg-slate-600" />}
                {testStatus === 'testing' && <Loader2 size={14} className="animate-spin text-indigo-400" />}
                {testStatus === 'success' && <CheckCircle2 size={14} className="text-emerald-500" />}
                {testStatus === 'error' && <AlertCircle size={14} className="text-red-500" />}
                
                <span className={`text-xs ${testStatus === 'error' ? 'text-red-400' : 'text-slate-400'}`}>
                    {testStatus === 'idle' ? '未测试' : testStatus === 'testing' ? '正在连接...' : testMessage}
                </span>
             </div>
             <button 
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
                className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors disabled:opacity-50 font-bold"
             >
                测试链接
             </button>
          </div>
          
          <p className="text-[10px] text-slate-500 text-center italic mt-4 font-songti">
            API 访问密钥已通过系统环境变量安全配置
          </p>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-800/30 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-sm text-slate-400 hover:text-white transition-colors font-songti">取消</button>
          <button onClick={handleSave} className="px-8 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-500/20 transition-all font-songti">
            确认
          </button>
        </div>
      </div>
    </div>
  );
}
