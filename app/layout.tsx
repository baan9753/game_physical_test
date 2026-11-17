import type { Metadata } from 'next';
import './globals.css';

// 페이지 제목과 검색/공유 시 노출되는 설명 (Next.js가 <head>에 자동 삽입)
export const metadata: Metadata = {
  title: '게이머 피지컬 테스트',
  description: '여섯 가지 픽셀 미니게임으로 즐기는 종합 능력 테스트',
};

/**
 * 모든 페이지를 감싸는 루트 레이아웃입니다.
 * - 전역 스타일(globals.css)을 한 번만 불러옵니다.
 * - 한국어 서비스이므로 html lang을 "ko"로 지정합니다.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
