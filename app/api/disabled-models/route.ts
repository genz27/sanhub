import { NextResponse } from 'next/server';
import { getSystemConfig } from '@/lib/db';
import { cache, CacheKeys } from '@/lib/cache';

// GET /api/disabled-models - 获取禁用的模型列表
export async function GET() {
  try {
    cache.delete(CacheKeys.SYSTEM_CONFIG);
    const config = await getSystemConfig();
    return NextResponse.json({
      success: true,
      data: config.disabledModels,
    });
  } catch (error) {
    console.error('[DisabledModels] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get disabled models' },
      { status: 500 }
    );
  }
}
