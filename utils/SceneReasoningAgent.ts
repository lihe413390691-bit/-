
export interface SceneReasoningInput {
  镜号: string;
  时长?: string;
  剧情: string;
  角色对话: string;
  动作事件: string;
  情绪氛围?: string;
}

export interface SceneReasoningOutput {
  绘画提示词: string;
  动画提示词: string;
  环境音: string;
}

/**
 * 智能体模板：根据小说剧本/分镜描述生成绘画和动画提示词
 * 支持链式推理（思考 → 行动 → 观察 → 总结）
 */
export class SceneReasoningAgent {
  private knowledge_base: any = {}; // 存储角色、场景、物件信息
  private previous_observations: any[] = []; // 记录上一个镜头的结果
  private scene_style: string = "2D动漫风格, 高质量"; // 默认绘画风格
  private animation_style: string = "流畅动态, 特效丰富"; // 默认动画风格

  constructor() {
    this.knowledge_base = {};
    this.previous_observations = [];
  }

  // ======================
  // 核心推理逻辑
  // ======================
  public reason_scene(shot_description: SceneReasoningInput): SceneReasoningOutput {
    /**
     * 链式推理生成绘画/动画提示
     * 输入：
     *     shot_description: dict
     *         {
     *             "镜号": "31-1-1",
     *             "时长": "5s",
     *             "剧情": "...",
     *             "角色对话": "...",
     *             "动作事件": "...",
     *             "情绪氛围": "宏大/惊悚/恐怖"
     *         }
     * 输出：
     *     dict: {
     *         "绘画提示词": "...",
     *         "动画提示词": "...",
     *         "环境音": "..."
     *     }
     */

    // 1️⃣ 思考 (分析场景关键元素)
    const scene_elements = this.extract_elements(shot_description);
    const perspective = this.infer_camera_perspective(shot_description);
    const atmosphere = this.infer_atmosphere(shot_description);
    const motion_elements = this.extract_dynamic_elements(shot_description);

    // 2️⃣ 行动 (生成绘画和动画提示)
    const painting_prompt = this.generate_painting_prompt(
      scene_elements,
      perspective,
      atmosphere
    );
    const animation_prompt = this.generate_animation_prompt(
      motion_elements,
      perspective,
      atmosphere
    );
    const sound_prompt = this.generate_environment_sound(shot_description);

    // 3️⃣ 观察 (可选：模拟智能体自我检查)
    const observation = this.check_coherence(
      painting_prompt,
      animation_prompt,
      shot_description
    );
    this.previous_observations.push(observation);

    // 4️⃣ 总结
    const result: SceneReasoningOutput = {
      "绘画提示词": painting_prompt,
      "动画提示词": animation_prompt,
      "环境音": sound_prompt,
    };
    return result;
  }

  // ======================
  // 辅助函数
  // ======================
  private extract_elements(shot: SceneReasoningInput) {
    /**
     * 提取场景、角色、物件信息
     */
    const elements = {
      "环境": shot.剧情 || "",
      "角色": shot.角色对话 || "",
      "动作": shot.动作事件 || "",
    };
    return elements;
  }

  private infer_camera_perspective(shot: SceneReasoningInput): string {
    /**
     * 根据剧情与镜号判断镜头类型
     */
    const description = shot.剧情 || "";
    if (description.includes("特写") || description.includes("脸部")) {
      return "近景特写";
    } else if (description.includes("广角") || description.includes("360度")) {
      return "广角/全景";
    } else if (description.includes("跟随") || description.includes("进入")) {
      return "中景跟随";
    } else if (description.includes("POV") || description.includes("第一人称")) {
      return "第一人称视角";
    } else {
      return "中景";
    }
  }

  private infer_atmosphere(shot: SceneReasoningInput): string {
    /**
     * 判断场景氛围：宏大、神圣、恐怖、温馨等
     */
    const description = shot.剧情 || "";
    if (description.includes("神圣") || description.includes("宏伟")) {
      return "宏大神圣";
    } else if (description.includes("惊恐") || description.includes("恐怖")) {
      return "恐怖惊悚";
    } else if (description.includes("可爱") || description.includes("Q版")) {
      return "轻松可爱";
    } else {
      return "中性";
    }
  }

  private extract_dynamic_elements(shot: SceneReasoningInput): string[] {
    /**
     * 提取动作和特效元素
     */
    const motion: string[] = [];
    const texts = [shot.动作事件 || "", shot.剧情 || ""];
    
    for (const text of texts) {
        if (text.includes("走入") || text.includes("拉升")) {
            motion.push("镜头拉升/跟随");
        }
        if (text.includes("发光") || text.includes("法阵") || text.includes("漩涡")) {
            motion.push("光效/魔法特效");
        }
        if (text.includes("攻击") || text.includes("战斗")) {
            motion.push("技能/能量光束");
        }
    }
    return motion;
  }

  private generate_painting_prompt(
    elements: { 环境: string; 角色: string; 动作: string },
    perspective: string,
    atmosphere: string
  ): string {
    /**
     * 生成绘画提示词
     */
    const prompt = `${this.scene_style}, ${perspective}, ${atmosphere}, 场景元素: ${elements['环境']}, 角色: ${elements['角色']}`;
    return prompt;
  }

  private generate_animation_prompt(
    motions: string[],
    perspective: string,
    atmosphere: string
  ): string {
    /**
     * 生成动画提示词
     */
    const motion_str = motions.length > 0 ? motions.join(", ") : "静态场景";
    const prompt = `${this.animation_style}, ${perspective}, ${atmosphere}, 动作特效: ${motion_str}`;
    return prompt;
  }

  private generate_environment_sound(shot: SceneReasoningInput): string {
    /**
     * 根据剧情和动作生成环境音提示
     */
    const text = shot.剧情 || "";
    if (text.includes("风")) return "风声";
    if (text.includes("火")) return "篝火噼啪声";
    if (text.includes("蝎") || text.includes("怪兽")) return "怪兽嘶吼/沙沙声";
    if (text.includes("可爱") || text.includes("Q版")) return "Q版加油声/砍柴声";
    return "环境背景音";
  }

  private check_coherence(
    painting_prompt: string,
    animation_prompt: string,
    shot: SceneReasoningInput
  ) {
    /**
     * 简单自我检查逻辑，保证提示词一致
     */
    return {
      "painting_length": painting_prompt.length,
      "animation_length": animation_prompt.length,
      "shot_id": shot.镜号,
    };
  }
}
