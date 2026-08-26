import { redirect } from 'next/navigation';

export default function Home() {
  // 重定向到品牌网站
  redirect('/index.html');
}
