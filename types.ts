
export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  hiddenContent?: string;
  toolCalls?: ToolCall[];
  groundingMetadata?: GroundingMetadata;
  isThinking?: boolean;
}

export interface ToolCall {
  id: string;
  name: string;
  args: any;
  result?: string;
  generatedImage?: string;
}

export interface GroundingMetadata {
  groundingChunks: {
    web?: {
      uri: string;
      title: string;
    };
  }[];
}

export enum ModelType {
  FLASH = 'gemini-3-flash-preview',
  PRO = 'gemini-3-pro-preview',
  DOUBAO = 'doubao-pro-32k'
}

export enum AgentMode {
  CINEMATIC = 'cinematic',
  STORYBOARD = 'storyboard',
  SCENE_STORYBOARD = 'scene_storyboard',
  VIDEO_GEN = 'video_gen'
}

export interface StoryboardShot {
  id: string;
  sceneGroup?: string;
  content: string;
  dialogue: string;
  visualPrompt: string;
  videoPrompt?: string;
  duration?: string;
  environmentSound?: string;
}

export const REASONING_SYSTEM_INSTRUCTION = `你是一名“电影级空景图推理助手”。请将文本转化为无人的、极具质感的空镜提示词。严禁出现人物。`;

export const STORYBOARD_SYSTEM_INSTRUCTION = `
## 【智能体身份】
你是一个专业 **小说 → 商业动画分镜提示词生成智能体（Storyboard Agent）**。

## 【核心工作流与硬性指标】
1. **上下文逻辑深度衔接**: 详尽读取剧本，严密分析前后镜头逻辑。确保地理位置、时间线、人物位移完全衔接，严禁逻辑断层。
2. **镜头密度 (硬性要求)**: 每次分析生成的镜头数量 **不得低于 24 个**。
3. **动画提示词 (奥斯卡级脚本) 极致要求**:
    - **开头声明**: 每个动画提示词块的开头必须包含 \`【二次元动漫风格，禁止展示原图，禁止显示字幕】\`。
    - **结构化时长**: 每一个镜号固定对应 15 秒总时长，内部必须细分为 4-5 个由 ▲ 引导的子镜头（例如 0-3s, 3-7s, 7-10s, 10-15s）。
    - **严禁静止**: 画面中人物禁止处于“静止不动”状态。必须描述具体的动态：如“由于紧张而快速起伏的胸膛”、“正在缓慢握紧的拳头”、“瞳孔的剧烈收缩”、“正在踉跄后退的步伐”、“发丝在气压中疯狂飞舞”。
    - **详尽描述**: 每个内景镜头必须包含：专业镜头名、**角色名**的动态细节、表情神态、情绪氛围、以及环境物理动态（如风吹效果、碎石飞溅、粒子浮动）。
    - **对话推进**: 将剧本中的对话内容、语气 ( ) 深度融入画面调度中，体现人物在说话时的动态反馈。
    - **专业特效**: 详细描述如粒子消散、水墨炸裂、残影叠化、空间撕裂等出场和进场特效。

## 【输出格式（Markdown表格）】
| 镜号 | 时长 | 剧情 | 角色对话 | 绘画提示词 | 动画提示词（奥斯卡级脚本） | 环境音 |
|---|---|---|---|---|---|---|

- **规则**: 严禁使用 [ ] 符号；严禁在提示词中包含 <br> 或任何 HTML 标签；角色名用 ** 包裹；语气用 ( )。
`;

export const VIDEO_PRODUCTION_INSTRUCTION = `
<Role>
你是一位获得奥斯卡奖的剪辑大师和动作导演。
任务：将分镜描述转化为一份 **15秒** 且包含 **4-5个动态子镜头** 的极致视觉脚本。
</Role>

<核心规则>
1. **开头必带**: \`【二次元动漫风格，禁止展示原图，禁止显示字幕】\`。
2. **结构**: 必须使用 4-5 个 ▲ 引导子镜头。总长 15s。
3. **严禁静止**: 每一个画面必须有明确的人物动态（呼吸、位移、表情变化）。严禁人物画面出现静止状态。
4. **细节要求**: 描述人物正在进行的具体动作（走路、站立时的肌肉微动、眼神锁定等）及其表情和情绪。
5. **环境动态**: 必须包含场景内部动态，如风吹的效果、光影晃动等。
6. **特效描述**: 专业地描述入场和进场特效，如粒子消散、残影叠化等。
7. **对白融入**: 自动将剧本对白、语气语气 ( ) 与人物的动作神态、对话表情推进进去。
8. **严禁标签**: 禁止输出 <br> 或 [ ]。

【二次元动漫风格，禁止展示原图，禁止显示字幕】
▲ 0-Xs [镜头名] 详细描述：包含 **角色名** 的具体动作细节、情绪神态、对话内容以及环境特效。
... (重复4-5次，确保逻辑完美衔接)
环境音：[详细描述音效与节奏]
`;
