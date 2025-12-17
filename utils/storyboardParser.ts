
import { StoryboardShot } from '../types';

export function parseStoryboardTable(markdown: string): StoryboardShot[] {
  const shots: StoryboardShot[] = [];
  const lines = markdown.split('\n');
  
  let headers: string[] = [];
  let lastSceneGroup = '';
  
  const sceneBlockMatch = markdown.match(/【场景】\s*([^\n|]+)/);
  if (sceneBlockMatch) lastSceneGroup = sceneBlockMatch[1].trim();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) continue;
    
    const rawCols = trimmed.split('|');
    if (rawCols[0].trim() === '') rawCols.shift();
    if (rawCols[rawCols.length - 1].trim() === '') rawCols.pop();
    const finalCols = rawCols.map(c => c.trim());
    if (finalCols.length < 3) continue;

    if (finalCols.some(c => c.includes('镜号') || c.includes('剧情') || c.includes('ID'))) {
      headers = finalCols;
      continue;
    }
    if (finalCols[0].match(/^[-:]+$/)) continue;

    const idIdx = headers.findIndex(h => h.includes('镜号') || h.includes('ID'));
    const sceneIdx = headers.findIndex(h => h.includes('场景') || h.includes('Scene'));
    const durIdx = headers.findIndex(h => h.includes('时长') || h.includes('时间') || h.includes('Duration'));
    const plotIdx = headers.findIndex(h => h.includes('剧情') || h.includes('概述'));
    const diaIdx = headers.findIndex(h => h.includes('对白') || h.includes('角色对话') || h.includes('台词'));
    const promptIdx = headers.findIndex(h => h.includes('绘画提示词') || h.includes('提示词'));
    const videoIdx = headers.findIndex(h => h.includes('动画') || h.includes('视频') || h.includes('脚本'));
    const soundIdx = headers.findIndex(h => h.includes('环境音') || h.includes('声音') || h.includes('Sound'));

    const id = idIdx !== -1 ? finalCols[idIdx] : '';
    if (!id || id === '镜号' || id === 'ID') continue;

    const currentScene = sceneIdx !== -1 ? finalCols[sceneIdx] : lastSceneGroup;

    shots.push({
        id,
        sceneGroup: currentScene || '默认场景',
        duration: durIdx !== -1 ? finalCols[durIdx] : '15s',
        content: plotIdx !== -1 ? finalCols[plotIdx] : '',
        dialogue: diaIdx !== -1 ? finalCols[diaIdx] : '',
        visualPrompt: promptIdx !== -1 ? finalCols[promptIdx] : '',
        videoPrompt: videoIdx !== -1 ? finalCols[videoIdx] : '',
        environmentSound: soundIdx !== -1 ? finalCols[soundIdx] : ''
    });
  }

  return shots;
}
