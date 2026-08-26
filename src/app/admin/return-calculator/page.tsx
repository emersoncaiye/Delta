'use client';

import { useState, useEffect } from 'react';

interface HoldTier {
  label: string;
  minDays: number;
  maxDays: number | null;
  rate: number;
}

interface CalcResult {
  holdDays: number;
  holdTier: string;
  rate: number;
  amount: number;
  mode: string;
  isCharity: boolean;
  charityRate: number;
  detail: string;
}

export default function ReturnCalculatorPage() {
  const [tiers, setTiers] = useState<HoldTier[]>([]);
  const [form, setForm] = useState({
    originalPrice: '',
    holdDays: '',
  });
  const [result, setResult] = useState<CalcResult | null>(null);

  useEffect(() => {
    fetch('/api/return-value')
      .then(res => res.json())
      .then(json => {
        if (json.success) setTiers(json.data);
      });
  }, []);

  const calculate = async () => {
    if (!form.originalPrice || !form.holdDays) return;
    const res = await fetch('/api/return-value', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalPrice: Number(form.originalPrice),
        holdDays: Number(form.holdDays),
        mode: 'exchange',
      }),
    });
    const json = await res.json();
    if (json.success) setResult(json.data);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title">回流金计算</h1>
        <p className="font-serif italic text-[#6b6558] text-[14px] mt-1">漂亮的东西应该流动 — 根据持有时间计算回流比例</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator */}
        <div className="admin-card p-6">
          <h2 className="admin-label mb-4">计算器</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#6b6558] mb-1 block">原始购入价 (¥)</label>
              <input
                type="number"
                value={form.originalPrice}
                onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))}
                placeholder="例如: 10000"
                className="w-full px-3 py-2 border border-[#e4e2e0] rounded-[2px] text-sm focus:outline-none focus:ring-1 focus:ring-[#5c7a64] font-number"
              />
            </div>
            <div>
              <label className="text-xs text-[#6b6558] mb-1 block">持有天数</label>
              <input
                type="number"
                value={form.holdDays}
                onChange={e => setForm(f => ({ ...f, holdDays: e.target.value }))}
                placeholder="例如: 30"
                className="w-full px-3 py-2 border border-[#e4e2e0] rounded-[2px] text-sm focus:outline-none focus:ring-1 focus:ring-[#5c7a64] font-number"
              />
            </div>
            <button
              onClick={calculate}
              className="w-full py-2.5 bg-[#050d06] hover:bg-[#1a2a1f] text-[#e4e2e0] rounded-[2px] text-sm transition-colors"
            >
              计算回流金
            </button>
          </div>

          {/* Result */}
          {result && (
            <div className="mt-6 p-4 bg-[#f0edeb] rounded-[2px] border border-[#e4e2e0]">
              <div className="text-xs text-[#6b6558] mb-2">计算结果</div>
              <div className="text-2xl font-number font-semibold text-[#5c7a64] mb-1">
                ¥{result.amount.toLocaleString()}
              </div>
              <div className="text-sm text-[#121212]">{result.detail}</div>
              {result.isCharity && (
                <div className="mt-2 text-xs text-[#5c7a64]">
                  该商品再次售出时，售价的 {(result.charityRate * 100).toFixed(0)}% 将注入公益金
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hold Tiers Table */}
        <div className="admin-card p-6">
          <h2 className="admin-label mb-4">持有时间与回流比例</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#6b6558] border-b border-[#e4e2e0]">
                <th className="pb-2 font-medium">持有时间</th>
                <th className="pb-2 font-medium text-right">回流比例</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier, idx) => (
                <tr key={idx} className="border-b border-[#e4e2e0]/50">
                  <td className="py-2.5 text-[#121212]">{tier.label}</td>
                  <td className="py-2.5 text-right font-number text-[#5c7a64]">
                    {tier.rate > 0 ? `${(tier.rate * 100).toFixed(0)}%` : '代售模式'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 p-3 bg-[#f0edeb] rounded-[2px] text-xs text-[#6b6558]">
            <div className="font-medium text-[#121212] mb-1">代售模式（1年以上）</div>
            持有超过1年的商品采用代售模式，售出后用户获得 70%，Em 获得 30%。
          </div>

          <div className="mt-3 p-3 bg-[#f0edeb] rounded-[2px] text-xs text-[#6b6558]">
            <div className="font-medium text-[#121212] mb-1">公益金机制</div>
            回流商品再次售出时，售价的 10% 自动注入公益金账户，按季度公示。
          </div>
        </div>
      </div>
    </div>
  );
}
