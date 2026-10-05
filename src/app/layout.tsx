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
  title: 'Nhai TOCFL - Học tiếng Đài Loan & Luyện thi TOCFL 3.0',
  description: 'Website tự học tiếng Đài Loan và luyện thi TOCFL 3.0 miễn phí từ cấp 1 đến cấp 9 với giáo trình từ vựng, ngữ pháp, pinyin và shadowing.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} ${patrickHand.variable}`} suppressHydrationWarning>
      <body className="paper-grid-bg" suppressHydrationWarning>
        <div id="app-root">{children}</div>
      </body>
    </html>
  );
}
