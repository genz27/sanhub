import { getSystemConfig } from './db';
import { fetch as undiciFetch, Agent, FormData } from 'undici';

// ========================================
// Sora OpenAI-Style Non-Streaming API
// ========================================

// 创建自定义 Agent
const soraAgent = new Agent({
  bodyTimeout: 0,
  headersTimeout: 1800000, // 30分钟
  keepAliveTimeout: 1800000, // 30分钟
  keepAliveMaxTimeout: 1800000, // 30分钟
  pipelining: 0,
  connections: 30,
  connect: {
    timeout: 1800000, // 30分钟
  },
});

// ========================================
// Video Generation API
// ========================================

export interface VideoGenerationRequest {
  prompt: string;
  model?: string;
  seconds?: '10' | '15';
  orientation?: 'landscape' | 'portrait';
  style_id?: string;
  input_image?: string; // Base64 encoded image
  remix_target_id?: string;
}

export interface VideoGenerationResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  data: Array<{
    url: string;
    permalink?: string;
    revised_prompt?: string;
    [key: string]: unknown;
  }>;
}

export async function generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
  const config = await getSystemConfig();

  if (!config.soraApiKey) {
    throw new Error('Sora API Key 未配置，请在管理后台配置 API 密钥');
  }

  if (!config.soraBaseUrl) {
    throw new Error('Sora Base URL 未配置');
  }

  const baseUrl = config.soraBaseUrl.replace(/\/$/, '');
  const apiUrl = `${baseUrl}/v1/videos`;

  console.log('[Sora API] 视频生成请求:', {
    apiUrl,
    model: request.model,
    prompt: request.prompt?.substring(0, 50),
  });

  // 使用 form-data 格式
  const formData = new FormData();
  
  // 如果没有 prompt，使用默认值
  const prompt = request.prompt || 'Generate video';
  
  console.log('[Sora API] 构建 form-data:', {
    prompt,
    model: request.model,
    seconds: request.seconds,
    orientation: request.orientation,
    hasInputImage: !!request.input_image,
  });
  
  formData.append('prompt', prompt);
  if (request.model) formData.append('model', request.model);
  if (request.seconds) formData.append('seconds', request.seconds);
  if (request.orientation) formData.append('orientation', request.orientation);
  if (request.style_id) formData.append('style_id', request.style_id);
  if (request.remix_target_id) formData.append('remix_target_id', request.remix_target_id);
  
  // 如果有输入图片，转换为 Blob
  if (request.input_image) {
    const imageBuffer = Buffer.from(request.input_image, 'base64');
    const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('input_reference', imageBlob, 'input.jpg');
  }

  const response = await undiciFetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.soraApiKey}`,
    },
    body: formData,
    dispatcher: soraAgent,
  });

  const data = await response.json() as any;

  console.log('[Sora API] 视频生成响应:', {
    status: response.status,
    ok: response.ok,
    data: JSON.stringify(data, null, 2),
  });

  if (!response.ok) {
    const errorMessage = data?.error?.message || data?.message || data?.error || '视频生成失败';
    console.error('[Sora API] 视频生成错误:', errorMessage, '完整响应:', JSON.stringify(data));
    throw new Error(errorMessage);
  }

  console.log('[Sora API] 视频生成成功:', data.data?.[0]?.url);
  return data as VideoGenerationResponse;
}

// ========================================
// Image Generation API
// ========================================

export interface ImageGenerationRequest {
  prompt: string;
  model?: string;
  n?: number;
  size?: string;
  quality?: 'standard' | 'hd';
  style?: 'natural' | 'vivid';
  response_format?: 'url' | 'b64_json';
  input_image?: string; // Base64 encoded image
}

export interface ImageGenerationResponse {
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
}

export async function generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
  const config = await getSystemConfig();

  if (!config.soraApiKey) {
    throw new Error('Sora API Key 未配置，请在管理后台配置 API 密钥');
  }

  if (!config.soraBaseUrl) {
    throw new Error('Sora Base URL 未配置');
  }

  const baseUrl = config.soraBaseUrl.replace(/\/$/, '');
  const apiUrl = `${baseUrl}/v1/images/generations`;

  console.log('[Sora API] 图片生成请求:', {
    apiUrl,
    model: request.model,
    prompt: request.prompt?.substring(0, 50),
  });

  const response = await undiciFetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.soraApiKey}`,
    },
    body: JSON.stringify(request),
    dispatcher: soraAgent,
  });

  const data = await response.json() as any;

  if (!response.ok) {
    const errorMessage = data?.error?.message || data?.message || '图片生成失败';
    console.error('[Sora API] 图片生成错误:', errorMessage);
    throw new Error(errorMessage);
  }

  console.log('[Sora API] 图片生成成功');
  return data as ImageGenerationResponse;
}

// ========================================
// Character Card API
// ========================================

export interface CharacterCardRequest {
  video_base64: string;
  model?: string;
  timestamps?: string;
  username?: string;
  display_name?: string;
  instruction_set?: string;
  safety_instruction_set?: string;
}

export interface CharacterCardResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  data: {
    cameo_id: string;
    username: string;
    display_name?: string;
    message: string;
  };
}

export async function createCharacterCard(request: CharacterCardRequest): Promise<CharacterCardResponse> {
  const config = await getSystemConfig();

  if (!config.soraApiKey) {
    throw new Error('Sora API Key 未配置，请在管理后台配置 API 密钥');
  }

  if (!config.soraBaseUrl) {
    throw new Error('Sora Base URL 未配置');
  }

  const baseUrl = config.soraBaseUrl.replace(/\/$/, '');
  const apiUrl = `${baseUrl}/v1/characters`;

  console.log('[Sora API] 角色卡创建请求');

  // 使用 form-data 格式
  const formData = new FormData();
  formData.append('model', request.model || 'sora-video-10s');
  formData.append('timestamps', request.timestamps || '0,3');
  if (request.username) formData.append('username', request.username);
  if (request.display_name) formData.append('display_name', request.display_name);
  if (request.instruction_set) formData.append('instruction_set', request.instruction_set);
  if (request.safety_instruction_set) formData.append('safety_instruction_set', request.safety_instruction_set);
  
  // 视频转换为 Blob
  const videoBuffer = Buffer.from(request.video_base64, 'base64');
  const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' });
  formData.append('video', videoBlob, 'video.mp4');

  const response = await undiciFetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.soraApiKey}`,
    },
    body: formData,
    dispatcher: soraAgent,
  });

  const data = await response.json() as any;

  if (!response.ok) {
    const errorMessage = data?.error?.message || data?.message || '角色卡创建失败';
    console.error('[Sora API] 角色卡创建错误:', errorMessage);
    throw new Error(errorMessage);
  }

  console.log('[Sora API] 角色卡创建成功:', JSON.stringify(data, null, 2));
  return data as CharacterCardResponse;
}

// ========================================
// Feed API (Public Feed)
// ========================================

export interface FeedRequest {
  limit?: number;
  cut?: 'nf2_latest' | 'nf2_top';
  cursor?: string;
}

export interface FeedItem {
  id: string;
  text: string;
  permalink: string;
  preview_image_url: string;
  posted_at: string;
  like_count: number;
  view_count: number;
  remix_count: number;
  attachment: {
    kind: string;
    url: string;
    downloadable_url: string;
    width: number;
    height: number;
    n_frames?: number;
    duration_seconds?: number;
  };
  author: {
    user_id: string;
    username: string;
    display_name: string;
    profile_picture_url: string;
  };
}

export interface FeedResponse {
  success: boolean;
  cut: string;
  count: number;
  cursor: string;
  items: FeedItem[];
}

export async function getFeed(request: FeedRequest = {}): Promise<FeedResponse> {
  const config = await getSystemConfig();

  if (!config.soraApiKey) {
    throw new Error('Sora API Key 未配置');
  }

  if (!config.soraBaseUrl) {
    throw new Error('Sora Base URL 未配置');
  }

  const baseUrl = config.soraBaseUrl.replace(/\/$/, '');
  const params = new URLSearchParams();
  if (request.limit) params.append('limit', String(request.limit));
  if (request.cut) params.append('cut', request.cut);
  if (request.cursor) params.append('cursor', request.cursor);

  const apiUrl = `${baseUrl}/v1/feed?${params.toString()}`;

  const response = await undiciFetch(apiUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${config.soraApiKey}`,
    },
    dispatcher: soraAgent,
  });

  const data = await response.json() as any;

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Feed 获取失败');
  }

  return data as FeedResponse;
}

// ========================================
// User Profile API
// ========================================

export interface ProfileResponse {
  success: boolean;
  profile: {
    user_id: string;
    username: string;
    display_name: string;
    profile_picture_url: string;
    follower_count: number;
  };
}

export async function getProfile(username: string): Promise<ProfileResponse> {
  const config = await getSystemConfig();

  if (!config.soraApiKey) {
    throw new Error('Sora API Key 未配置');
  }

  if (!config.soraBaseUrl) {
    throw new Error('Sora Base URL 未配置');
  }

  const baseUrl = config.soraBaseUrl.replace(/\/$/, '');
  const apiUrl = `${baseUrl}/v1/profiles/${encodeURIComponent(username)}`;

  const response = await undiciFetch(apiUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${config.soraApiKey}`,
    },
    dispatcher: soraAgent,
  });

  const data = await response.json() as any;

  if (!response.ok) {
    throw new Error(data?.error?.message || '用户资料获取失败');
  }

  return data as ProfileResponse;
}

// ========================================
// User Feed API
// ========================================

export interface UserFeedRequest {
  user_id: string;
  limit?: number;
  cursor?: string;
}

export async function getUserFeed(request: UserFeedRequest): Promise<FeedResponse> {
  const config = await getSystemConfig();

  if (!config.soraApiKey) {
    throw new Error('Sora API Key 未配置');
  }

  if (!config.soraBaseUrl) {
    throw new Error('Sora Base URL 未配置');
  }

  const baseUrl = config.soraBaseUrl.replace(/\/$/, '');
  const params = new URLSearchParams();
  if (request.limit) params.append('limit', String(request.limit));
  if (request.cursor) params.append('cursor', request.cursor);

  const apiUrl = `${baseUrl}/v1/users/${encodeURIComponent(request.user_id)}/feed?${params.toString()}`;

  const response = await undiciFetch(apiUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${config.soraApiKey}`,
    },
    dispatcher: soraAgent,
  });

  const data = await response.json() as any;

  if (!response.ok) {
    throw new Error(data?.error?.message || '用户内容获取失败');
  }

  return data as FeedResponse;
}

// ========================================
// Character Search API
// ========================================

export interface CharacterSearchRequest {
  username: string;
  intent?: 'users' | 'cameo';
  limit?: number;
}

export interface CharacterSearchResponse {
  success: boolean;
  query: string;
  count: number;
  results: Array<{
    user_id: string;
    username: string;
    display_name: string;
    profile_picture_url: string;
    can_cameo: boolean;
    token: string;
  }>;
}

export async function searchCharacters(request: CharacterSearchRequest): Promise<CharacterSearchResponse> {
  const config = await getSystemConfig();

  if (!config.soraApiKey) {
    throw new Error('Sora API Key 未配置');
  }

  if (!config.soraBaseUrl) {
    throw new Error('Sora Base URL 未配置');
  }

  const baseUrl = config.soraBaseUrl.replace(/\/$/, '');
  const params = new URLSearchParams();
  params.append('username', request.username);
  if (request.intent) params.append('intent', request.intent);
  if (request.limit) params.append('limit', String(request.limit));

  const apiUrl = `${baseUrl}/v1/characters/search?${params.toString()}`;

  const response = await undiciFetch(apiUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${config.soraApiKey}`,
    },
    dispatcher: soraAgent,
  });

  const data = await response.json() as any;

  if (!response.ok) {
    throw new Error(data?.error?.message || '角色搜索失败');
  }

  return data as CharacterSearchResponse;
}

// ========================================
// Invite Code API
// ========================================

export interface InviteCodeResponse {
  success: boolean;
  invite_code: string;
  remaining_count: number;
  total_count: number;
  email: string;
}

export async function getInviteCode(): Promise<InviteCodeResponse> {
  const config = await getSystemConfig();

  if (!config.soraApiKey) {
    throw new Error('Sora API Key 未配置');
  }

  if (!config.soraBaseUrl) {
    throw new Error('Sora Base URL 未配置');
  }

  const baseUrl = config.soraBaseUrl.replace(/\/$/, '');
  const apiUrl = `${baseUrl}/v1/invite-codes`;

  const response = await undiciFetch(apiUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${config.soraApiKey}`,
    },
    dispatcher: soraAgent,
  });

  const data = await response.json() as any;

  if (!response.ok) {
    throw new Error(data?.error?.message || '邀请码获取失败');
  }

  return data as InviteCodeResponse;
}
