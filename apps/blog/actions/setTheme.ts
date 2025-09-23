'use server';

import { cookies } from 'next/headers';

export async function setTheme(theme:string) {
  // 设置 Cookie，有效期 30 天，路径为根目录
  const cookie = await cookies();
  cookie.set('theme', theme, {
    maxAge: 60 * 60 * 24 * 30, // 30 天
    path: '/', // 全站可用
    httpOnly: false, // 允许客户端读取（如需客户端也访问）
    secure: process.env.NODE_ENV === 'production', // 生产环境使用 HTTPS
  });
  // 这里的返回值其实没有意义，只是为了播种 cookies
  return void 0; 
}