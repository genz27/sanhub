import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSafeVideoModels, getSafeVideoChannels } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - 获取可用的视频模型列表（不含敏感信息）
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const [models, channels] = await Promise.all([
      getSafeVideoModels(true), // 只获取启用的模型
      getSafeVideoChannels(true), // 只获取启用的渠道
    ]);

    return NextResponse.json({
      success: true,
      data: {
        models,
        channels,
      },
    });
  } catch (error) {
    console.error('[API] Get safe video models error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取失败' },
      { status: 500 }
    );
  }
}
