import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '三角洲 · Delta',
  description: 'Objects for a moving life. 漂亮的东西应该流动。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.cn" />
        <link rel="preconnect" href="https://fonts.gstatic.cn" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.cn/css2?family=Hanken+Grotesk:wght@300;400;500;600;700&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Noto+Serif+SC:wght@300;400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
