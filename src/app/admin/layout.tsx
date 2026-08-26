import type { Metadata } from 'next';
import '../globals.css';
import { Sidebar } from '@/components/layout/sidebar';

export const metadata: Metadata = {
  title: '三角洲 · 管理后台',
  description: 'THAT Program - 循环商店管理系统',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body style={{ 
        fontFamily: "'Hanken Grotesk', Inter, -apple-system, sans-serif",
        background: '#fbf9f7',
        color: '#121212',
        margin: 0,
        minHeight: '100vh'
      }}>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <main style={{ 
            flex: 1, 
            padding: '40px',
            marginLeft: '240px',
            maxWidth: 'calc(100% - 240px)'
          }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
