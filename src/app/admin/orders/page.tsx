'use client';

import { useEffect, useState } from 'react';
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

interface Order {
  id: string;
  orderNo: string;
  itemId: string;
  itemName: string;
  buyerName: string;
  buyerContact: string;
  amount: number;
  status: string;
  returnValue?: {
    holdDays: number;
    holdTier: string;
    exchangeRate: number;
    cashRate: number;
    exchangeAmount: number;
    cashAmount: number;
    charityAmount: number;
  };
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  pending: '待处理',
  paid: '已付款',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
  returned: '已退回',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);

  const fetchOrders = () => {
    setLoading(true);
    const params = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
    fetch(`/api/orders${params}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setOrders(json.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchOrders();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">订单管理</h1>
          <p className="font-serif italic text-[#6b6558] text-[14px] mt-1">选品下单与订单流转追踪</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-[#050d06] hover:bg-[#1a2a1f] text-[#e4e2e0]"
        >
          + 创建订单
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
            <SelectItem value="pending">待处理</SelectItem>
            <SelectItem value="paid">已付款</SelectItem>
            <SelectItem value="shipped">已发货</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
            <SelectItem value="cancelled">已取消</SelectItem>
            <SelectItem value="returned">已退回</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-[2px] border border-[#e4e2e0]">
        {loading ? (
          <div className="p-12 text-center text-[#6b6558]">加载中...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-[#6b6558]">暂无订单</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#6b6558] border-b border-[#e4e2e0]">
                  <th className="px-5 py-3 font-medium">订单号</th>
                  <th className="px-5 py-3 font-medium">物品</th>
                  <th className="px-5 py-3 font-medium">买家</th>
                  <th className="px-5 py-3 font-medium">状态</th>
                  <th className="px-5 py-3 font-medium text-right">金额</th>
                  <th className="px-5 py-3 font-medium">创建时间</th>
                  <th className="px-5 py-3 font-medium text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b border-[#e4e2e0]/50 hover:bg-[#f0edeb] transition-colors">
                    <td className="px-5 py-3.5 font-number text-[#050d06]">{order.orderNo}</td>
                    <td className="px-5 py-3.5 text-[#121212]">{order.itemName}</td>
                    <td className="px-5 py-3.5">
                      <div className="text-[#121212]">{order.buyerName}</div>
                      <div className="text-xs text-[#6b6558]">{order.buyerContact}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant="secondary" className={`status-${order.status} border-0`}>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right font-number text-[#5c7a64] font-medium">
                      ¥{order.amount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-[#6b6558] font-number text-xs">
                      {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex justify-center gap-1">
                        {order.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'paid')}
                            className="text-xs text-[#5c7a64] hover:text-[#5c7a64]"
                          >
                            确认付款
                          </Button>
                        )}
                        {order.status === 'paid' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'shipped')}
                            className="text-xs text-[#3d5243] hover:text-[#3d5243]"
                          >
                            发货
                          </Button>
                        )}
                        {order.status === 'shipped' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'completed')}
                            className="text-xs text-[#6b6558] hover:text-[#6b6558]"
                          >
                            完成
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      {showCreate && <CreateOrderModal onClose={() => setShowCreate(false)} onCreated={fetchOrders} />}
    </div>
  );
}

function CreateOrderModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [items, setItems] = useState<Array<{ id: string; name: string; sellingPrice: number; status: string }>>([]);
  const [form, setForm] = useState({
    itemId: '',
    buyerName: '',
    buyerContact: '',
    returnMode: '',
  });

  useEffect(() => {
    fetch('/api/items?status=on_sale')
      .then(res => res.json())
      .then(json => {
        if (json.success) setItems(json.data);
      });
  }, []);

  const handleSubmit = async () => {
    if (!form.itemId || !form.buyerName || !form.buyerContact) return;
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId: form.itemId,
        buyerName: form.buyerName,
        buyerContact: form.buyerContact,
        returnMode: form.returnMode || undefined,
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
        <h2 className="text-lg font-semibold text-[#050d06] mb-4">创建订单</h2>
        <div className="space-y-3">
          <Select value={form.itemId} onValueChange={v => setForm(f => ({ ...f, itemId: v }))}>
            <SelectTrigger className="border-[#e4e2e0]">
              <SelectValue placeholder="选择物品" />
            </SelectTrigger>
            <SelectContent>
              {items.map(item => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} - ¥{item.sellingPrice.toLocaleString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="买家姓名"
            value={form.buyerName}
            onChange={e => setForm(f => ({ ...f, buyerName: e.target.value }))}
            className="border-[#e4e2e0]"
          />
          <Input
            placeholder="联系方式"
            value={form.buyerContact}
            onChange={e => setForm(f => ({ ...f, buyerContact: e.target.value }))}
            className="border-[#e4e2e0]"
          />
          <Select value={form.returnMode} onValueChange={v => setForm(f => ({ ...f, returnMode: v }))}>
            <SelectTrigger className="border-[#e4e2e0]">
              <SelectValue placeholder="回流方式（可选）" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="exchange">换购积分</SelectItem>
              <SelectItem value="cash">现金返还</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="border-[#e4e2e0]">取消</Button>
          <Button onClick={handleSubmit} className="bg-[#050d06] hover:bg-[#1a2a1f] text-[#e4e2e0]">创建</Button>
        </div>
      </div>
    </div>
  );
}
