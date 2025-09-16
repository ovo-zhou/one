'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function setTheme(theme:string) {
  // 设置 Cookie，有效期 30 天，路径为根目录
  const cookie = await cookies();
  cookie.set('theme', theme, {
    maxAge: 60 * 60 * 24 * 30, // 30 天
    path: '/', // 全站可用
    httpOnly: false, // 允许客户端读取（如需客户端也访问）
    secure: process.env.NODE_ENV === 'production', // 生产环境使用 HTTPS
  });
  return 0; // 设置后重定向回首页
}