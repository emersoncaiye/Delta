'use client';

import { useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  device_id: string | null;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ email: '', name: '', device_id: '' });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      if (json.success) setUsers(json.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        setShowForm(false);
        setFormData({ email: '', name: '', device_id: '' });
        fetchUsers();
      } else {
        alert(json.error);
      }
    } catch (err) {
      console.error('Failed to create user:', err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#121212]">用户管理</h1>
          <p className="text-sm text-[#6b6558] mt-1">管理用户身份，关联购买和送回记录</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-[#5c7a64] text-white rounded text-sm hover:bg-[#b8985d] transition-colors"
        >
          添加用户
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-[2px] border border-[#e5e5e5] p-5">
          <h3 className="text-lg font-semibold mb-4">添加用户</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#6b6558] mb-1">邮箱 *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-[#e5e5e5] rounded text-sm focus:outline-none focus:border-[#5c7a64]"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[#6b6558] mb-1">姓名 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-[#e5e5e5] rounded text-sm focus:outline-none focus:border-[#5c7a64]"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[#6b6558] mb-1">设备ID（可选）</label>
              <input
                type="text"
                value={formData.device_id}
                onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                className="w-full px-3 py-2 border border-[#e5e5e5] rounded text-sm focus:outline-none focus:border-[#5c7a64]"
                placeholder="用于无邮箱场景的身份识别"
              />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="px-4 py-2 bg-[#5c7a64] text-white rounded text-sm hover:bg-[#b8985d]">
                保存
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-[#e5e5e5] rounded text-sm text-[#6b6558]">
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-[#6b6558]">加载中...</div>
      ) : (
        <div className="bg-white rounded-[2px] border border-[#e5e5e5] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#f0edeb]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6b6558] uppercase">姓名</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6b6558] uppercase">邮箱</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6b6558] uppercase">设备ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6b6558] uppercase">注册时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[#6b6558]">暂无用户</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-[#f0edeb] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-[#121212]">{user.name}</td>
                    <td className="px-4 py-3 text-sm text-[#6b6558]">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-[#6b6558] font-number">{user.device_id || '-'}</td>
                    <td className="px-4 py-3 text-sm text-[#6b6558] font-number">
                      {new Date(user.created_at).toLocaleDateString('zh-CN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
