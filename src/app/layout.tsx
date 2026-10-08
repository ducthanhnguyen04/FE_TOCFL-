import type { Metadata } from 'next';
import { Be_Vietnam_Pro, Patrick_Hand } from 'next/font/google';
import './globals.css';

const beVietnamPro = Be_Vietnam_Pro({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin', 'vietnamese'],
  variable: '--font-body',
  display: 'swap',
});

const patrickHand = Patrick_Hand({
  weight: ['400'],
  subsets: ['latin', 'vietnamese'],
  variable: '--font-doodle',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Nhai TOCFL - Học tiếng Đài Loan & Luyện thi TOCFL',
  description: 'Website tự học tiếng Đài Loan và luyện thi TOCFL 3.0 miễn phí từ cấp 1 đến cấp 9 với giáo trình từ vựng, ngữ pháp, pinyin và shadowing.',
};

import { UserProvider } from '@/providers/UserProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { LanguageProvider } from '@/providers/LanguageProvider';
import { createClient } from '@/lib/supabase/server';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="vi" className={`${beVietnamPro.variable} ${patrickHand.variable}`} suppressHydrationWarning>
      <body className="paper-grid-bg" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <LanguageProvider>
            <UserProvider initialUser={user}>
              <div id="app-root">{children}</div>
            </UserProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
