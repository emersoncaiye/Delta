import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// DELETE /api/favorites/[id] - Remove item from favorites
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get('x-session');
    if (!token) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const client = getSupabaseClient(token);
    const { data: { user }, error: authError } = await client.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: '认证失败' }, { status: 401 });
    }

    const { id } = await params;

    const { error } = await client
      .from('user_favorites')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove favorite:', error);
    return NextResponse.json(
      { success: false, error: '取消收藏失败' },
      { status: 500 }
    );
  }
}
