import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getImageChannels,
  getImageChannel,
  createImageChannel,
  updateImageChannel,
  deleteImageChannel,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - 获取所有渠道
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const channels = await getImageChannels();
    return NextResponse.json({ success: true, data: channels });
  } catch (error) {
    console.error('[API] Get image channels error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取失败' },
      { status: 500 }
    );
  }
}

// POST - 创建渠道
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const body = await request.json();
    const { name, type, baseUrl, apiKey, enabled } = body;

    if (!name || !type) {
      return NextResponse.json({ error: '名称和类型必填' }, { status: 400 });
    }

    const channel = await createImageChannel({
      name,
      type,
      baseUrl: baseUrl || '',
      apiKey: apiKey || '',
      enabled: enabled !== false,
    });

    return NextResponse.json({ success: true, data: channel });
  } catch (error) {
    console.error('[API] Create image channel error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '创建失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新渠道
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: '缺少 ID' }, { status: 400 });
    }

    const channel = await updateImageChannel(id, updates);
    if (!channel) {
      return NextResponse.json({ error: '渠道不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: channel });
  } catch (error) {
    console.error('[API] Update image channel error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '更新失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除渠道
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少 ID' }, { status: 400 });
    }

    const success = await deleteImageChannel(id);
    if (!success) {
      return NextResponse.json({ error: '删除失败' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Delete image channel error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '删除失败' },
      { status: 500 }
    );
  }
}
