'use client';

import { useEffect, useState } from 'react';

interface CharityData {
  totalAmount: number;
  quarterlySummary: Array<{
    quarter: string;
    totalAmount: number;
    recordCount: number;
    records: Array<{
      id: string;
      orderNo: string;
      itemName: string;
      salePrice: number;
      charityAmount: number;
      quarter: string;
      createdAt: string;
    }>;
  }>;
  records: Array<{
    id: string;
    orderNo: string;
    itemName: string;
    salePrice: number;
    charityAmount: number;
    quarter: string;
    createdAt: string;
  }>;
}

export default function CharityPage() {
  const [data, setData] = useState<CharityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/charity')
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#6b6558]">加载中...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8b6914]">加载失败</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title">公益金追踪</h1>
        <p className="font-serif italic text-[#6b6558] text-[14px] mt-1">回流商品再次售出时，售价的10%注入公益金</p>
      </div>

      {/* Total */}
      <div className="bg-white rounded-[2px] border border-[#e4e2e0] p-8 mb-8 text-center">
        <div className="text-xs text-[#6b6558] mb-2">公益金累计总额</div>
        <div className="text-4xl font-number font-semibold text-[#5c7a64]">
          ¥{data.totalAmount.toLocaleString()}
        </div>
        <div className="text-xs text-[#6b6558] mt-2">
          共 {data.records.length} 笔记录
        </div>
      </div>

      {/* Quarterly Breakdown */}
      {data.quarterlySummary.length > 0 ? (
        <div className="space-y-6">
          {data.quarterlySummary.map(q => (
            <div key={q.quarter} className="bg-white rounded-[2px] border border-[#e4e2e0] p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-[#050d06]">{q.quarter} 季度公示</h2>
                  <p className="text-xs text-[#6b6558] mt-0.5">
                    {q.recordCount} 笔记录 · 合计 ¥{q.totalAmount.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-number font-semibold text-[#5c7a64]">
                    ¥{q.totalAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#6b6558] border-b border-[#e4e2e0]">
                    <th className="pb-2 font-medium">订单号</th>
                    <th className="pb-2 font-medium">物品</th>
                    <th className="pb-2 font-medium text-right">售价</th>
                    <th className="pb-2 font-medium text-right">公益金(10%)</th>
                    <th className="pb-2 font-medium">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {q.records.map(record => (
                    <tr key={record.id} className="border-b border-[#e4e2e0]/50">
                      <td className="py-2.5 font-number text-[#050d06]">{record.orderNo}</td>
                      <td className="py-2.5 text-[#121212]">{record.itemName}</td>
                      <td className="py-2.5 text-right font-number text-[#6b6558]">
                        ¥{record.salePrice.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right font-number text-[#5c7a64] font-medium">
                        ¥{record.charityAmount.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-[#6b6558] font-number text-xs">
                        {new Date(record.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[2px] border border-[#e4e2e0] p-12 text-center">
          <div className="text-[#6b6558] text-sm">暂无公益金记录</div>
          <div className="text-[#6b6558] text-xs mt-1">当回流商品再次售出时，将自动记录</div>
        </div>
      )}
    </div>
  );
}
