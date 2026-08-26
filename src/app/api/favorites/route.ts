import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/favorites - Get current user's favorites
export async function GET(req: NextRequest) {
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

    const { data, error } = await client
      .from('user_favorites')
      .select(`
        *,
        items (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data.map((fav: { items: { id?: string; name: string; code: string; selling_price: number; status: string; photos: string[] }; created_at: string; id: string }) => ({
        id: fav.id,
        item: {
          id: fav.items.id || '',
          name: fav.items.name,
          code: fav.items.code,
          sellingPrice: fav.items.selling_price,
          status: fav.items.status,
          photos: fav.items.photos || [],
        },
        createdAt: fav.created_at,
      })),
    });
  } catch (error) {
    console.error('Failed to get favorites:', error);
    return NextResponse.json(
      { success: false, error: '获取收藏失败' },
      { status: 500 }
    );
  }
}

// POST /api/favorites - Add item to favorites
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json({ success: false, error: '缺少商品ID' }, { status: 400 });
    }

    const { data, error } = await client
      .from('user_favorites')
      .insert({
        user_id: user.id,
        item_id: itemId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: false, error: '已经收藏过了' }, { status: 400 });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to add favorite:', error);
    return NextResponse.json(
      { success: false, error: '收藏失败' },
      { status: 500 }
    );
  }
}
