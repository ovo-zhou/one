import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import ThemeSelect from '@/components/ThemeSelect';
import { Theme } from '@/components/ThemeProvider';
import { Sailboat } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { Github } from 'lucide-react';
import { UserStar } from 'lucide-react';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '首页',
  description: 'ryan 出品, 必属精品',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookie = await cookies();
  // 默认 light 主题
  const theme = (cookie?.get('theme')?.value || Theme.Light) as Theme;
  return (
    <html lang="en" data-theme={theme} data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark:bg-gray-800 dark:text-white transition-colors duration-300`}
      >
        <ThemeProvider initTheme={theme}>
          <header className="sticky top-0 z-10 bg-white dark:bg-slate-800 shadow-md">
            <nav className="p-4 mx-auto w-full sm:w-full md:w-8/12 lg:w-xl xl:w-2xl 2xl:w-3xl flex justify-between">
              <div className="flex gap-4 items-center">
                <Sailboat />
                <Link className="text-sm" href="/">
                  首页
                </Link>
              </div>
              <div className="flex gap-4 items-center">
                <ThemeSelect />
                <Link href="https://github.com/ovo-zhou/one" target="_blank">
                  <Github size={16} />
                </Link>
                <Link href="https://ryandev.cn/admin" target="_blank">
                  <UserStar size={16} />
                </Link>
              </div>
            </nav>
          </header>
          <main className="p-4 mx-auto z-0 w-full sm:w-full md:w-8/12 lg:w-xl xl:w-2xl 2xl:w-3xl">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
