'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Submission {
  id: string;
  submitterName: string;
  submitterContact: string;
  itemName: string;
  description: string;
  photos: string[];
  expectedPrice: number;
  category: string;
  status: string;
  reviewNote?: string;
  reviewedAt?: string;
  generatedItemId?: string;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
};

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);

  const fetchSubmissions = () => {
    setLoading(true);
    const params = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
    fetch(`/api/submissions${params}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setSubmissions(json.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSubmissions();
  }, [filterStatus]);

  const handleReview = async (id: string, status: 'approved' | 'rejected', note: string) => {
    await fetch(`/api/submissions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reviewNote: note }),
    });
    fetchSubmissions();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">闲置提交</h1>
          <p className="font-serif italic text-[#6b6558] text-[14px] mt-1">用户提交闲置 → Em审核 → 通过后上架代售</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-[#050d06] hover:bg-[#1a2a1f] text-[#e4e2e0]"
        >
          + 模拟提交
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
            <SelectItem value="pending">待审核</SelectItem>
            <SelectItem value="approved">已通过</SelectItem>
            <SelectItem value="rejected">已拒绝</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submissions Grid */}
      {loading ? (
        <div className="p-12 text-center text-[#6b6558] bg-white rounded-[2px] border border-[#e4e2e0]">加载中...</div>
      ) : submissions.length === 0 ? (
        <div className="p-12 text-center text-[#6b6558] bg-white rounded-[2px] border border-[#e4e2e0]">暂无提交</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {submissions.map(sub => (
            <div key={sub.id} className="bg-white rounded-[2px] border border-[#e4e2e0] p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#050d06]">{sub.itemName}</h3>
                  <p className="text-xs text-[#6b6558] mt-0.5">{sub.submitterName} · {sub.submitterContact}</p>
                </div>
                <Badge variant="secondary" className={`status-${sub.status} border-0`}>
                  {statusLabels[sub.status] || sub.status}
                </Badge>
              </div>

              <p className="text-sm text-[#121212] mb-3 line-clamp-2">{sub.description}</p>

              <div className="flex items-center gap-4 text-xs text-[#6b6558] mb-3">
                <span>分类: {sub.category}</span>
                <span>预期价格: <span className="font-number text-[#5c7a64]">¥{sub.expectedPrice.toLocaleString()}</span></span>
              </div>

              <div className="text-xs text-[#6b6558] font-number">
                提交于 {new Date(sub.createdAt).toLocaleString('zh-CN')}
              </div>

              {sub.reviewNote && (
                <div className="mt-3 p-2 bg-[#f0edeb] rounded text-xs text-[#6b6558]">
                  审核备注: {sub.reviewNote}
                </div>
              )}

              {sub.status === 'pending' && (
                <ReviewActions onSubmit={(status, note) => handleReview(sub.id, status, note)} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Submission Modal */}
      {showCreate && <CreateSubmissionModal onClose={() => setShowCreate(false)} onCreated={fetchSubmissions} />}
    </div>
  );
}

function ReviewActions({ onSubmit }: { onSubmit: (status: 'approved' | 'rejected', note: string) => void }) {
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'approved' | 'rejected' | null>(null);

  const handleAction = (status: 'approved' | 'rejected') => {
    if (showNote && pendingStatus === status) {
      onSubmit(status, note);
    } else {
      setPendingStatus(status);
      setShowNote(true);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-[#e4e2e0]">
      {showNote && (
        <Textarea
          placeholder="审核备注..."
          value={note}
          onChange={e => setNote(e.target.value)}
          className="mb-2 border-[#e4e2e0] text-sm min-h-[60px]"
        />
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => handleAction('approved')}
          className="bg-[#5c7a64] hover:bg-[#247a40] text-white text-xs"
        >
          通过
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAction('rejected')}
          className="border-[#e4e2e0] text-xs text-[#c94040] hover:text-[#c94040]"
        >
          拒绝
        </Button>
        {showNote && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setShowNote(false); setPendingStatus(null); }}
            className="text-xs text-[#6b6558]"
          >
            取消
          </Button>
        )}
      </div>
    </div>
  );
}

function CreateSubmissionModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    submitterName: '',
    submitterContact: '',
    itemName: '',
    description: '',
    category: '',
    expectedPrice: '',
    photos: '',
  });

  const handleSubmit = async () => {
    if (!form.submitterName || !form.itemName || !form.expectedPrice || !form.category) return;
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        expectedPrice: Number(form.expectedPrice),
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
        <h2 className="text-lg font-semibold text-[#050d06] mb-4">提交闲置物品</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="提交人姓名"
              value={form.submitterName}
              onChange={e => setForm(f => ({ ...f, submitterName: e.target.value }))}
              className="border-[#e4e2e0]"
            />
            <Input
              placeholder="联系方式"
              value={form.submitterContact}
              onChange={e => setForm(f => ({ ...f, submitterContact: e.target.value }))}
              className="border-[#e4e2e0]"
            />
          </div>
          <Input
            placeholder="物品名称"
            value={form.itemName}
            onChange={e => setForm(f => ({ ...f, itemName: e.target.value }))}
            className="border-[#e4e2e0]"
          />
          <Textarea
            placeholder="物品描述"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="border-[#e4e2e0] min-h-[80px]"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="分类"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="border-[#e4e2e0]"
            />
            <Input
              placeholder="预期价格"
              type="number"
              value={form.expectedPrice}
              onChange={e => setForm(f => ({ ...f, expectedPrice: e.target.value }))}
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
          <Button onClick={handleSubmit} className="bg-[#050d06] hover:bg-[#1a2a1f] text-[#e4e2e0]">提交</Button>
        </div>
      </div>
    </div>
  );
}
