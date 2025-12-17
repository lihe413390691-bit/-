
import { FunctionDeclaration, Type } from "@google/genai";

// 1. Define the Calculator Tool
export const calculatorDeclaration: FunctionDeclaration = {
  name: 'calculator',
  parameters: {
    type: Type.OBJECT,
    description: '执行数学计算。支持基本运算 (+, -, *, /) 和括号。',
    properties: {
      expression: {
        type: Type.STRING,
        description: '需要计算的数学表达式 (例如： "12 * 45 + (10/2)")。',
      },
    },
    required: ['expression'],
  },
};

// 2. Define the Image Generation Tool
export const generateImageDeclaration: FunctionDeclaration = {
  name: 'generate_image',
  parameters: {
    type: Type.OBJECT,
    description: '基于详细的文本提示生成图片。用于可视化剧本中推断出的场景、空镜头或概念。',
    properties: {
      prompt: {
        type: Type.STRING,
        description: '用于生成图片的详细视觉描述 (例如："夜晚的空巷子，雨水打在路面上，霓虹灯倒影，35mm镜头")。',
      },
    },
    required: ['prompt'],
  },
};

export function executeCalculator(expression: string): string {
  try {
    // Safety check: only allow digits, operators, parens, dot, and spaces
    if (/[^0-9+\-*/().\s]/.test(expression)) {
      return "Error: Invalid characters in expression.";
    }
    // eslint-disable-next-line no-new-func
    const result = new Function(`return ${expression}`)();
    return String(result);
  } catch (error) {
    return `Error calculating expression: ${error}`;
  }
}

export const toolsDeclarations = [calculatorDeclaration, generateImageDeclaration];
