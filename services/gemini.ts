
import { GoogleGenAI, GenerateContentResponse, Tool, Part } from "@google/genai";
import { Message, ToolCall, ModelType } from "../types";
import { executeCalculator, toolsDeclarations } from "../utils/tools";

/**
 * Tests the connection to the Gemini API.
 */
export async function testGeminiConnection(): Promise<{ success: boolean; message: string }> {
  // Fix: Initialize GoogleGenAI within the function using process.env.API_KEY as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    // Attempt a lightweight generation to verify connectivity
    await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: "Hi" }] }
    });
    return { success: true, message: "连接成功！" };
  } catch (error: any) {
    console.error("Connection Test Failed:", error);
    return { success: false, message: error.message || "连接失败。" };
  }
}

export async function sendMessageToGemini(
  prompt: string,
  history: any[],
  modelId: ModelType,
  systemInstruction: string,
  onUpdate: (partial: Partial<Message>) => void
): Promise<{ content: string; groundingMetadata?: any }> {
  
  // Fix: Create a new GoogleGenAI instance right before making an API call using process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Fix: Remove redundant comparison that causes type overlap error, using modelId directly
  const effectiveModel = modelId;

  // Setup Chat with tools
  const tools: Tool[] = [
    { functionDeclarations: toolsDeclarations },
    { googleSearch: {} } // Enable Grounding
  ];

  try {
    const chat = ai.chats.create({
      model: effectiveModel,
      config: {
        systemInstruction,
        tools,
        temperature: 0.2,
      },
      history: history
    });

    let finalContent = "";
    let finalGroundingMetadata = undefined;
    
    // Send message to Gemini
    let response: GenerateContentResponse = await chat.sendMessage({ message: prompt });
    
    const maxTurns = 5;
    let turns = 0;
    const collectedToolCalls: ToolCall[] = [];

    while (turns < maxTurns) {
      if (response.text) {
        finalContent += response.text;
      }

      if (response.candidates?.[0]?.groundingMetadata) {
          finalGroundingMetadata = response.candidates[0].groundingMetadata;
      }

      const functionCalls = response.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        turns++;
        const parts: Part[] = [];

        for (const call of functionCalls) {
          const toolCallId = call.id || Math.random().toString();
          const uiToolCall: ToolCall = {
              id: toolCallId,
              name: call.name,
              args: call.args,
              result: undefined 
          };
          collectedToolCalls.push(uiToolCall);
          onUpdate({ toolCalls: [...collectedToolCalls] });

          let result = "";
          
          if (call.name === 'calculator') {
            const expression = (call.args as any)['expression'];
            result = executeCalculator(expression);
            uiToolCall.result = result;
          } 
          else if (call.name === 'generate_image') {
            try {
              const imagePrompt = (call.args as any)['prompt'];
              
              // Use nano banana model as per guidelines for images
              // Fix: Create fresh instance as per guidelines
              const imgAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
              const imageResponse = await imgAi.models.generateContent({
                model: 'gemini-2.5-flash-image', 
                contents: { parts: [{ text: imagePrompt }] }
              });

              let base64Image = null;
              if (imageResponse.candidates && imageResponse.candidates.length > 0) {
                const content = imageResponse.candidates[0].content;
                const imagePart = content.parts.find(p => p.inlineData);
                if (imagePart && imagePart.inlineData) {
                  base64Image = imagePart.inlineData.data;
                }
              }

              if (base64Image) {
                 result = "图片生成成功。";
                 uiToolCall.generatedImage = base64Image;
                 uiToolCall.result = "图片已生成。";
              } else {
                 result = "错误：模型未返回图片。";
                 uiToolCall.result = "生成图片失败。";
              }

            } catch (e: any) {
              console.error("Image generation error", e);
              result = `生成图片出错: ${e.message}`;
              uiToolCall.result = "生成图片错误。";
            }
          } 
          else {
            result = "错误：未知工具。";
            uiToolCall.result = result;
          }

          onUpdate({ toolCalls: [...collectedToolCalls] });

          parts.push({
            functionResponse: {
              id: call.id,
              name: call.name,
              response: { result: result }
            }
          });
        }

        response = await chat.sendMessage({ message: parts });
      } else {
        break;
      }
    }

    return {
      content: finalContent,
      groundingMetadata: finalGroundingMetadata
    };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Handle 404 specifically
    if (error.message?.includes('404') || error.message?.includes('not found')) {
        throw new Error("模型未找到 (404)。请确保使用了正确的模型名称（如 gemini-3-flash-preview）。");
    }
    throw error;
  }
}
