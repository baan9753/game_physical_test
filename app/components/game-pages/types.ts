import type { Translate } from '../../../lib/game-copy';
import type { GameLocale } from '../../../lib/game-locale';
import type { FocusEvent, KeyboardEvent, RefObject } from 'react';
import type { Direction, Stage, State } from '../../../lib/game-types';

/**
 * ViewModel(game.tsx)이 화면에 전달하는 데이터와 사용자 입력 콜백 전체입니다.
 * 각 페이지 컴포넌트는 아래 하위 타입(Pick)으로 필요한 항목만 받아 사용합니다.
 */
export type GameViewModel = {
  // ----- 데이터 -----
  t: Translate;
  locale: GameLocale;
  onLocaleChange: (locale: GameLocale) => void;
  state: State; // 게임 전체 상태 (모드, 단계, 점수 등)
  musicEnabled: boolean; // 배경음악 켜짐 여부
  sfxEnabled: boolean; // 효과음 켜짐 여부
  root: RefObject<HTMLDivElement>; // 키 입력을 받는 최상위 요소
  canvas: RefObject<HTMLCanvasElement>; // 플레이 화면 캔버스
  radar: RefObject<HTMLCanvasElement>; // 결과 화면 육각형 차트 캔버스
  d: Stage | null; // 현재 단계의 진행 데이터 (없으면 null)
  hudText: string[]; // HUD 문구 [상태 요약, 안내 왼쪽, 안내 오른쪽]
  total: number; // 6단계 점수 합계
  avg: number; // 점수 평균 (0~100)
  ageDisplay: string; // 평균 점수를 환산한 피지컬 나이 표시
  grade: string; // 환산 등급 이름
  best: number; // 가장 높은 단계 점수
  worst: number; // 가장 낮은 단계 점수

  // ----- 입력/동작 콜백 -----
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onKeyUp: (event: KeyboardEvent<HTMLDivElement>) => void;
  onBlur: (event: FocusEvent<HTMLDivElement>) => void;
  onToggleMusic: () => void; // 배경음악 켜기/끄기
  onToggleSfx: () => void; // 효과음 켜기/끄기
  onStart: (stage: number, practice: boolean) => void; // 홈에서 연습/전체 테스트 시작
  onBeginStage: () => void; // 단계 안내 화면에서 카운트다운 시작
  onTogglePause: () => void; // 일시정지/재개
  onGoHome: () => void; // 처음 화면으로 이동
  onAction: (value?: number, direction?: Direction) => void; // 단계별 행동 입력 (선택 번호/방향 포함 가능)
  onMove: (direction: Direction) => void; // 3단계 이동 시작
  onStop: (direction: Direction) => void; // 3단계 이동 중지
  onNext: () => void; // 단계 결과 화면에서 다음으로
  onMosquitoMove: (x: number, y: number) => void; // 2단계 포인터 이동 (캔버스 좌표 800x450 기준)
  onMosquitoLeave: () => void; // 2단계 포인터가 캔버스를 벗어남
  onMosquitoHit: (x: number, y: number) => void; // 2단계 클릭/터치
};

// ----- 페이지별로 필요한 항목만 골라 쓰는 하위 타입 -----

/** 홈 화면: 시작 콜백만 필요 */
export type HomePageModel = Pick<GameViewModel, 't' | 'onStart'>;
/** 단계 안내 화면: 현재 단계 정보와 시작 콜백 */
export type StageIntroPageModel = Pick<GameViewModel, 't' | 'state' | 'onBeginStage'>;
/** 플레이 화면: HUD, 캔버스, 각종 조작 콜백 */
export type GameplayPageModel = Pick<
  GameViewModel,
  | 't'
  | 'state'
  | 'd'
  | 'hudText'
  | 'root'
  | 'canvas'
  | 'onAction'
  | 'onMove'
  | 'onStop'
  | 'onMosquitoMove'
  | 'onMosquitoLeave'
  | 'onMosquitoHit'
>;
/** 단계 결과 화면: 단계 데이터와 다음 이동 콜백 */
export type StageCompletePageModel = Pick<
  GameViewModel,
  't' | 'state' | 'd' | 'onNext' | 'onBeginStage'
>;
/** 종합 결과 화면: 점수 요약, 차트 캔버스, 다시 도전 콜백 */
export type OverallResultsPageModel = Pick<
  GameViewModel,
  't' | 'state' | 'radar' | 'ageDisplay' | 'grade' | 'avg' | 'total' | 'best' | 'worst' | 'onGoHome'
>;
