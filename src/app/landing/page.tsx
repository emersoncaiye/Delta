import { redirect } from 'next/navigation';

export default function LandingPage() {
  // 重定向到静态品牌网站
  redirect('/index.html');
}
