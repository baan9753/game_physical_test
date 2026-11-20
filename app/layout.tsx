import type { Metadata } from 'next';
import { translator } from '../lib/game-copy';
import { defaultLocale } from '../lib/game-locale';
import './globals.css';

const t = translator(defaultLocale);

// 페이지 제목과 검색/공유 시 노출되는 설명 (Next.js가 <head>에 자동 삽입)
export const metadata: Metadata = {
  title: t('title'),
  description: t('description'),
};

/**
 * 모든 페이지를 감싸는 루트 레이아웃입니다.
 * - 전역 스타일(globals.css)을 한 번만 불러옵니다.
 * - 브라우저에서 저장된 언어 또는 기기 언어를 불러옵니다.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={defaultLocale}>
      <body>{children}</body>
    </html>
  );
}
