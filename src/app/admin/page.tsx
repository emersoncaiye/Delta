import { redirect } from 'next/navigation';

export default function AdminHome() {
  // 管理后台首页重定向到仪表盘
  redirect('/admin/items');
}
