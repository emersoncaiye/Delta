'use client';

import { useState, useEffect, useCallback } from 'react';

interface HoldRecord {
  id: string;
  user_id: string;
  item_id: string;
  order_id: string | null;
  purchase_price: string;
  purchase_date: string;
  return_date: string | null;
  return_mode: string | null;
  return_amount: string | null;
  return_rate: string | null;
  hold_days: number | null;
  hold_tier: string | null;
  status: string;
  created_at: string;
}

export default function HoldRecordsPage() {
  const [records, setRecords] = useState<HoldRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReturnForm, setShowReturnForm] = useState<string | null>(null);
  const [returnData, setReturnData] = useState({ return_date: '', return_mode: 'exchange' });

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch('/api/hold-records');
      const json = await res.json();
      if (json.success) setRecords(json.data);
    } catch (err) {
      console.error('Failed to fetch hold records:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleReturn = async (id: string) => {
    try {
      const res = await fetch(`/api/hold-records/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnData),
      });
      const json = await res.json();
      if (json.success) {
        setShowReturnForm(null);
        setReturnData({ return_date: '', return_mode: 'exchange' });
        fetchRecords();
      } else {
        alert(json.error);
      }
    } catch (err) {
      console.error('Failed to process return:', err);
    }
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    holding: { label: '持有中', color: '#3d5243' },
    returned: { label: '已退回', color: '#6b6558' },
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#121212]">持有记录</h1>
        <p className="text-sm text-[#6b6558] mt-1">追踪每件物品的购买和退回，计算回流金额</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#6b6558]">加载中...</div>
      ) : (
        <div className="bg-white rounded-[2px] border border-[#e5e5e5] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#f0edeb]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6b6558] uppercase">物品ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6b6558] uppercase">购买价格</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6b6558] uppercase">购买日期</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6b6558] uppercase">持有天数</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6b6558] uppercase">档位</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6b6558] uppercase">回流金额</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6b6558] uppercase">状态</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6b6558] uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[#6b6558]">暂无持有记录</td>
                </tr>
              ) : (
                records.map((record) => (
                  <>
                    <tr key={record.id} className="hover:bg-[#f0edeb] transition-colors">
                      <td className="px-4 py-3 text-sm text-[#121212] font-number truncate max-w-[100px]">
                        {record.item_id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-sm font-number text-[#5c7a64]">
                        ¥{parseFloat(record.purchase_price).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#6b6558] font-number">
                        {new Date(record.purchase_date).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#121212] font-number">
                        {record.hold_days ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#6b6558]">
                        {record.hold_tier || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-number text-[#5c7a64]">
                        {record.return_amount ? `¥${parseFloat(record.return_amount).toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${statusLabels[record.status]?.color}15`,
                            color: statusLabels[record.status]?.color,
                          }}
                        >
                          {statusLabels[record.status]?.label || record.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {record.status === 'holding' && (
                          <button
                            onClick={() => setShowReturnForm(record.id)}
                            className="text-xs text-[#5c7a64] hover:underline"
                          >
                            处理退回
                          </button>
                        )}
                      </td>
                    </tr>
                    {showReturnForm === record.id && (
                      <tr key={`${record.id}-form`} className="bg-[#f0edeb]">
                        <td colSpan={8} className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <input
                              type="date"
                              value={returnData.return_date}
                              onChange={(e) => setReturnData({ ...returnData, return_date: e.target.value })}
                              className="px-2 py-1 border border-[#e5e5e5] rounded text-sm"
                            />
                            <select
                              value={returnData.return_mode}
                              onChange={(e) => setReturnData({ ...returnData, return_mode: e.target.value })}
                              className="px-2 py-1 border border-[#e5e5e5] rounded text-sm"
                            >
                              <option value="exchange">换购积分</option>
                              <option value="cash">现金返还</option>
                            </select>
                            <button
                              onClick={() => handleReturn(record.id)}
                              className="px-3 py-1 bg-[#5c7a64] text-white rounded text-sm"
                            >
                              确认
                            </button>
                            <button
                              onClick={() => setShowReturnForm(null)}
                              className="px-3 py-1 border border-[#e5e5e5] rounded text-sm text-[#6b6558]"
                            >
                              取消
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
