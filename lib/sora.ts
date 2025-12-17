import { getSystemConfig } from './db';
import type { SoraGenerateRequest, GenerateResult } from '@/types';
import { generateVideo, type VideoGenerationRequest } from './sora-api';

// ========================================
// Sora API 封装 (Non-Streaming)
// ========================================

// 获取生成类型和成本
function getTypeAndCost(
  model: string,
  pricing: { soraVideo10s: number; soraVideo15s: number }
): { type: 'sora-video'; cost: number } {
  if (model.includes('15s')) {
    return { type: 'sora-video', cost: pricing.soraVideo15s };
  }
  return { type: 'sora-video', cost: pricing.soraVideo10s };
}

// 从模型名称解析方向和时长
function parseModelParams(model: string): { orientation: 'landscape' | 'portrait'; seconds: '10' | '15' } {
  let orientation: 'landscape' | 'portrait' = 'landscape';
  let seconds: '10' | '15' = '10';

  if (model.includes('portrait')) {
    orientation = 'portrait';
  }
  if (model.includes('15s') || model.includes('15')) {
    seconds = '15';
  }

  return { orientation, seconds };
}

// 生成内容 (Non-Streaming)
export async function generateWithSora(
  request: SoraGenerateRequest
): Promise<GenerateResult> {
  const config = await getSystemConfig();

  console.log('[Sora] 请求配置:', {
    model: request.model,
    prompt: request.prompt?.substring(0, 50),
    hasFiles: request.files && request.files.length > 0,
    filesCount: request.files?.length || 0,
  });

  // 解析模型参数
  const { orientation, seconds } = parseModelParams(request.model);

  // 构建非流式 API 请求
  const videoRequest: VideoGenerationRequest = {
    prompt: request.prompt,
    model: request.model,
    orientation,
    seconds,
  };

  // 如果有参考图片，添加到请求
  if (request.files && request.files.length > 0) {
    const imageFile = request.files.find(f => f.mimeType.startsWith('image/'));
    if (imageFile) {
      videoRequest.input_image = imageFile.data;
    }
  }

  // 添加风格和 Remix 参数
  if (request.style_id) {
    videoRequest.style_id = request.style_id;
  }
  if (request.remix_target_id) {
    videoRequest.remix_target_id = request.remix_target_id;
  }

  // 调用非流式 API
  const result = await generateVideo(videoRequest);

  if (!result.data || result.data.length === 0 || !result.data[0].url) {
    throw new Error('视频生成失败：未返回有效的视频 URL');
  }

  const first = result.data[0];

  const { type, cost } = getTypeAndCost(request.model, config.pricing);

  console.log('[Sora] 生成成功:', { type, url: result.data[0].url, cost });

  return {
    type,
    url: first.url,
    cost,
    permalink: typeof first.permalink === 'string' ? first.permalink : undefined,
    revised_prompt: typeof first.revised_prompt === 'string' ? first.revised_prompt : undefined,
  };
}
