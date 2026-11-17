import Game from './game';

/**
 * 루트 경로("/")의 페이지입니다.
 * 별도 서버 로직 없이 클라이언트 컴포넌트인 Game(게임 본체)을 그대로 렌더링합니다.
 */
export default function HomePage() {
  return <Game />;
}
