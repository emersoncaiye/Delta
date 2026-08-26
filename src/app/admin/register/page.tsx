'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseConfig } from '@/lib/supabase-config-inject';
import { getSupabaseBrowserClientWithRetry } from '@/lib/supabase-browser';
import Link from 'next/link';
import Image from 'next/image';

export default function RegisterPage() {
  const router = useRouter();
  const { isLoading: configLoading, error: configError } = useSupabaseConfig();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码至少需要6个字符');
      return;
    }

    setLoading(true);

    try {
      const supabase = await getSupabaseBrowserClientWithRetry();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (authError) {
        setError(authError.message || '注册失败');
        return;
      }

      if (data.session) {
        router.push('/');
      } else {
        router.push('/login');
      }
    } catch (err) {
      setError('注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf9f7]">
        <p className="font-serif italic text-[#6b6558]">加载中...</p>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf9f7]">
        <p className="font-serif italic text-[#8b6914]">配置加载失败</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbf9f7] px-4 py-12">
      <div className="w-full max-w-[360px]">
        {/* Logo & Brand */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-[2px] overflow-hidden bg-[#050d06] flex items-center justify-center">
            <Image
              src="https://coze-coding-project.tos.coze.site/gen_project_icon/2026-07-10/7660735864162648079_1783655430.png?sign=4905756392-c3bc54e508-0-e24b2bdd572ec70bfb2c0553818aa4a8fc97c2c00e09a57ffbf79c5d09c60335"
              alt="THAT Program"
              width={64}
              height={64}
              className="object-cover"
            />
          </div>
          <h1 className="font-serif text-[24px] text-[#050d06] mb-1">THAT Program</h1>
          <p className="font-serif italic text-[#6b6558] text-[13px]">漂亮的东西应该流动</p>
        </div>

        {/* Register Form */}
        <div className="bg-white border border-[#e4e2e0] rounded-[2px] p-8">
          <h2 className="font-serif text-[18px] text-[#050d06] mb-6">注册</h2>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="admin-label">姓名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-[#e4e2e0] rounded-[2px] text-[14px] text-[#121212] bg-[#fbf9f7] focus:outline-none focus:border-[#5c7a64] transition-colors"
                placeholder="你的名字"
              />
            </div>

            <div>
              <label className="admin-label">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-[#e4e2e0] rounded-[2px] text-[14px] text-[#121212] bg-[#fbf9f7] focus:outline-none focus:border-[#5c7a64] transition-colors"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="admin-label">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 pr-10 border border-[#e4e2e0] rounded-[2px] text-[14px] text-[#121212] bg-[#fbf9f7] focus:outline-none focus:border-[#5c7a64] transition-colors"
                  placeholder="至少6个字符"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6558] hover:text-[#050d06] transition-colors"
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="admin-label">确认密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-[#e4e2e0] rounded-[2px] text-[14px] text-[#121212] bg-[#fbf9f7] focus:outline-none focus:border-[#5c7a64] transition-colors"
                placeholder="再次输入密码"
              />
            </div>

            {error && (
              <p className="text-[13px] text-[#8b6914] bg-[#fef9ef] border border-[#f0e6d2] rounded-[2px] px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#050d06] text-white text-[14px] font-medium rounded-[2px] hover:bg-[#1a2a1f] transition-colors disabled:opacity-50"
            >
              {loading ? '注册中...' : '注册'}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-[#6b6558]">
            已有账号？{' '}
            <Link href="/login" className="text-[#5c7a64] hover:underline">
              去登录
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center font-serif italic text-[12px] text-[#6b6558]">
          Taste · Hold · Transfer
        </p>
      </div>
    </div>
  );
}
