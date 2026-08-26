'use client';

import { useEffect, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { getSupabaseBrowserClientWithRetry } from '@/lib/supabase-browser';

interface Item {
  id: string;
  code: string;
  name: string;
  description: string;
  photos: string[];
  category: string;
  originalPrice: number;
  sellingPrice: number;
  status: string;
  sourceOrigin: string;
  flowHistory: Array<{
    timestamp: string;
    action: string;
    note?: string;
  }>;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  on_sale: '在售',
  sold: '已售',
  reserved: '已预定',
  repair: '待修复',
};

export default function ItemsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const fetchItems = () => {
    setLoading(true);
    const params = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
    fetch(`/api/items${params}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setItems(json.data);
      })
      .finally(() => setLoading(false));
  };

  // Fetch user's favorites
  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    try {
      const supabase = await getSupabaseBrowserClientWithRetry();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/favorites', {
        headers: { 'x-session': session.access_token },
      });
      const json = await res.json();
      if (json.success) {
        const ids = new Set<string>(json.data.map((f: { item: { id: string } }) => f.item.id));
        setFavoriteIds(ids);
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    }
  }, [user]);

  // Toggle favorite
  const toggleFavorite = async (itemId: string) => {
    if (!user) return;
    try {
      const supabase = await getSupabaseBrowserClientWithRetry();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const isFavorited = favoriteIds.has(itemId);

      if (isFavorited) {
        // Remove from favorites
        const favRes = await fetch('/api/favorites', {
          headers: { 'x-session': session.access_token },
        });
        const favJson = await favRes.json();
        if (favJson.success) {
          const fav = favJson.data.find((f: { item: { id: string }; id: string }) => f.item.id === itemId);
          if (fav) {
            await fetch(`/api/favorites/${fav.id}`, {
              method: 'DELETE',
              headers: { 'x-session': session.access_token },
            });
            setFavoriteIds(prev => {
              const next = new Set(prev);
              next.delete(itemId);
              return next;
            });
          }
        }
      } else {
        // Add to favorites
        await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-session': session.access_token,
          },
          body: JSON.stringify({ itemId }),
        });
        setFavoriteIds(prev => new Set(prev).add(itemId));
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [filterStatus]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">库存管理</h1>
          <p className="font-serif italic text-[#6b6558] text-[14px] mt-1">管理代售物品与流转记录</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-[#050d06] hover:bg-[#1a2a1f] text-[#e4e2e0]"
        >
          + 新增物品
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-3 mb-6">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 border-[#e4e2e0]">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="on_sale">在售</SelectItem>
            <SelectItem value="sold">已售</SelectItem>
            <SelectItem value="reserved">已预定</SelectItem>
            <SelectItem value="repair">待修复</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-[2px] border border-[#e4e2e0]">
        {loading ? (
          <div className="p-12 text-center text-[#6b6558]">加载中...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-[#6b6558]">暂无物品</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#6b6558] border-b border-[#e4e2e0]">
                  <th className="px-5 py-3 font-medium">编号</th>
                  <th className="px-5 py-3 font-medium">名称</th>
                  <th className="px-5 py-3 font-medium">分类</th>
                  <th className="px-5 py-3 font-medium">来源</th>
                  <th className="px-5 py-3 font-medium">状态</th>
                  <th className="px-5 py-3 font-medium text-right">原价</th>
                  <th className="px-5 py-3 font-medium text-right">售价</th>
                  <th className="px-5 py-3 font-medium text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b border-[#e4e2e0]/50 hover:bg-[#f0edeb] transition-colors">
                    <td className="px-5 py-3.5 font-number text-[#050d06]">{item.code}</td>
                    <td className="px-5 py-3.5 text-[#121212] max-w-[200px] truncate">{item.name}</td>
                    <td className="px-5 py-3.5 text-[#6b6558]">{item.category}</td>
                    <td className="px-5 py-3.5 text-[#6b6558] text-xs">{item.sourceOrigin}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant="secondary" className={`status-${item.status} border-0`}>
                        {statusLabels[item.status] || item.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right font-number text-[#6b6558]">
                      ¥{item.originalPrice.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right font-number text-[#5c7a64] font-medium">
                      ¥{item.sellingPrice.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {user && (
                          <button
                            onClick={() => toggleFavorite(item.id)}
                            className="p-1.5 hover:bg-[#f0edeb] rounded-[2px] transition-colors"
                            title={favoriteIds.has(item.id) ? '取消收藏' : '收藏'}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill={favoriteIds.has(item.id) ? '#5c7a64' : 'none'}
                              stroke={favoriteIds.has(item.id) ? '#5c7a64' : '#6b6558'}
                              strokeWidth="1.5"
                            >
                              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                            </svg>
                          </button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedItem(item)}
                          className="text-[#6b6558] hover:text-[#050d06]"
                        >
                          详情
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && <CreateItemModal onClose={() => setShowCreate(false)} onCreated={fetchItems} />}

      {/* Detail Modal */}
      {selectedItem && <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} onUpdate={fetchItems} />}
    </div>
  );
}

function CreateItemModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    originalPrice: '',
    sellingPrice: '',
    sourceOrigin: '',
    photos: '',
  });

  const handleSubmit = async () => {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        originalPrice: Number(form.originalPrice),
        sellingPrice: Number(form.sellingPrice),
        photos: form.photos ? form.photos.split(',').map(s => s.trim()) : [],
      }),
    });
    const json = await res.json();
    if (json.success) {
      onCreated();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-[2px] w-full max-w-lg p-6 mx-4">
        <h2 className="text-lg font-semibold text-[#050d06] mb-4">新增库存物品</h2>
        <div className="space-y-3">
          <Input
            placeholder="物品名称"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="border-[#e4e2e0]"
          />
          <Input
            placeholder="描述"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="border-[#e4e2e0]"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="分类"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="border-[#e4e2e0]"
            />
            <Input
              placeholder="来源"
              value={form.sourceOrigin}
              onChange={e => setForm(f => ({ ...f, sourceOrigin: e.target.value }))}
              className="border-[#e4e2e0]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="原价"
              type="number"
              value={form.originalPrice}
              onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))}
              className="border-[#e4e2e0]"
            />
            <Input
              placeholder="售价"
              type="number"
              value={form.sellingPrice}
              onChange={e => setForm(f => ({ ...f, sellingPrice: e.target.value }))}
              className="border-[#e4e2e0]"
            />
          </div>
          <Input
            placeholder="照片URL（逗号分隔）"
            value={form.photos}
            onChange={e => setForm(f => ({ ...f, photos: e.target.value }))}
            className="border-[#e4e2e0]"
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="border-[#e4e2e0]">取消</Button>
          <Button onClick={handleSubmit} className="bg-[#050d06] hover:bg-[#1a2a1f] text-[#e4e2e0]">创建</Button>
        </div>
      </div>
    </div>
  );
}

function ItemDetailModal({ item, onClose, onUpdate }: {
  item: Item;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const handleStatusChange = async (newStatus: string) => {
    await fetch(`/api/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    onUpdate();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-[2px] w-full max-w-2xl p-6 mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-number text-[#5c7a64] text-sm">{item.code}</span>
              <Badge variant="secondary" className={`status-${item.status} border-0`}>
                {statusLabels[item.status] || item.status}
              </Badge>
            </div>
            <h2 className="text-lg font-semibold text-[#050d06] mt-1">{item.name}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>关闭</Button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#f0edeb] rounded p-3">
            <div className="text-xs text-[#6b6558]">分类</div>
            <div className="text-sm text-[#121212] mt-1">{item.category}</div>
          </div>
          <div className="bg-[#f0edeb] rounded p-3">
            <div className="text-xs text-[#6b6558]">来源</div>
            <div className="text-sm text-[#121212] mt-1">{item.sourceOrigin}</div>
          </div>
          <div className="bg-[#f0edeb] rounded p-3">
            <div className="text-xs text-[#6b6558]">原价</div>
            <div className="text-sm font-number text-[#121212] mt-1">¥{item.originalPrice.toLocaleString()}</div>
          </div>
          <div className="bg-[#f0edeb] rounded p-3">
            <div className="text-xs text-[#6b6558]">售价</div>
            <div className="text-sm font-number text-[#5c7a64] font-medium mt-1">¥{item.sellingPrice.toLocaleString()}</div>
          </div>
        </div>

        {item.description && (
          <div className="mb-6">
            <div className="text-xs text-[#6b6558] mb-1">描述</div>
            <p className="text-sm text-[#121212]">{item.description}</p>
          </div>
        )}

        {/* Flow History */}
        <div className="mb-6">
          <div className="text-xs text-[#6b6558] mb-3">流转履历</div>
          <div className="space-y-2">
            {item.flowHistory.map((record, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-[#5c7a64] mt-1.5 shrink-0" />
                <div>
                  <div className="text-[#121212]">{record.note || record.action}</div>
                  <div className="text-xs text-[#6b6558] font-number">
                    {new Date(record.timestamp).toLocaleString('zh-CN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex gap-2 pt-4 border-t border-[#e4e2e0]">
          <span className="text-xs text-[#6b6558] self-center mr-2">变更状态:</span>
          {['on_sale', 'sold', 'reserved', 'repair'].map(s => (
            <Button
              key={s}
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange(s)}
              disabled={item.status === s}
              className="border-[#e4e2e0] text-xs"
            >
              {statusLabels[s]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
