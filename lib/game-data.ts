import type { Direction, Flag, State } from './game-types';

export const names = [
  '돌 골렘 피하기',
  '모기 잡기',
  '탄환 피하기',
  '청기 백기',
  '10초 맞추기',
  '방향키 로켓',
];
export const skills = ['반응속도', '에임 정확도', '회피 능력', '판단력', '시간 감각', '입력 속도'];
// 파리채 그림은 손잡이 끝을 포인터에 붙이고, 망이 지나가는 궤적으로 타격을 판정합니다.
export const swatterGeometry = {
  spriteAnchorShift: { x: 2.5, y: 12 },
  swingDuration: 0.24,
  hitRadius: 23,
};
export function timerScoreFromError(error: number) {
  if (error <= 0.2) return 100;
  if (error <= 0.5) return Math.max(90, 99 - Math.floor(((error - 0.2) / 0.3) * 10));
  if (error <= 1) return Math.max(80, 89 - Math.floor(((error - 0.5) / 0.5) * 10));
  if (error <= 1.5) return Math.max(70, 79 - Math.floor(((error - 1) / 0.5) * 10));
  if (error <= 2) return Math.max(60, 69 - Math.floor(((error - 1.5) / 0.5) * 10));
  return Math.max(0, 59 - Math.floor((error - 2) * 20));
}
export function timerGradeFromScore(score: number) {
  if (score === 100) return 'PERFECT';
  if (score >= 90) return 'GREAT';
  if (score >= 80) return 'COOL';
  if (score >= 70) return 'GOOD';
  if (score >= 60) return 'BAD';
  return 'MISS';
}
export const guides = [
  [
    '돌진하는 돌 골렘을 피하세요!\n위험 표시가 나타난 뒤 3초 안에 골렘이 돌진합니다.\n기회는 총 5번이며 실패하면 기회가 사라집니다.\n100ms 이하의 반응은 예측으로 실패 처리됩니다.',
    'D·F 키를 누르거나\n화면의 버튼을 클릭 하세요.',
  ],
  [
    '20초 동안 날아다니는 모기를 잡으세요!\n포획 수와 클릭 정확도로 점수를 측정합니다.',
    '마우스나 터치로 조준한 뒤 클릭하세요.\n파리채가 포인터를 따라옵니다.',
  ],
  [
    '날아오는 탄환을 피하며 최대 40초 버티세요.\n시간이 지날수록 탄환이 많아지고 패턴이 다양해집니다.\n생존 시간으로 점수를 계산합니다.',
    '방향키 또는 W/A/S/D로 이동하세요.\n화면의 방향 버튼을 누르고 있어도 이동합니다.',
  ],
  [
    '30초 동안 화면에 나오는 지시를 따르세요.\n문장을 잘 읽고 금지된 동작은 누르지 마세요!',
    '청기 올리기/내리기는 W·S키\n백기 올리기/내리기는 O·K 키를 누르세요.\n화면 버튼도 사용할 수 있습니다.',
  ],
  [
    '타이밍에 맞춰 10초를 정확하게 누르세요.\n10초에 가까울수록 높은 점수를 얻습니다!',
    'SPACE 키 또는 정지 버튼을 눌러 시간을 멈추세요.',
  ],
  [
    '화살표 방향에 맞게 방향키를 입력하세요.\n한 줄을 모두 성공하면 로켓이 발사됩니다.\n실패해도 점수 차감은 없습니다.\n최대한 많은 로켓을 발사하세요!',
    '키보드의 ↑·↓·←·→ 방향키를 누르세요.\n화면의 방향 버튼을 클릭해도 됩니다.',
  ],
];
export const flags: Flag[] = [
  // 1. 기본 단일 동작
  { text: '청기 올려!', answer: 0 },
  { text: '청기 내려!', answer: 1 },
  { text: '백기 올려!', answer: 2 },
  { text: '백기 내려!', answer: 3 },

  // 긍정 동작 뒤에 금지 동작이 오는 문장
  { text: '청기 올리고, 청기 내리지 마!', answer: 0 },
  { text: '청기 올리고, 백기 올리지 마!', answer: 0 },
  { text: '청기 올리고, 백기 내리지 마!', answer: 0 },
  { text: '청기 내리고, 청기 올리지 마!', answer: 1 },
  { text: '청기 내리고, 백기 올리지 마!', answer: 1 },
  { text: '청기 내리고, 백기 내리지 마!', answer: 1 },
  { text: '백기 올리고, 청기 올리지 마!', answer: 2 },
  { text: '백기 올리고, 청기 내리지 마!', answer: 2 },
  { text: '백기 올리고, 백기 내리지 마!', answer: 2 },
  { text: '백기 내리고, 청기 올리지 마!', answer: 3 },
  { text: '백기 내리고, 청기 내리지 마!', answer: 3 },
  { text: '백기 내리고, 백기 올리지 마!', answer: 3 },

  // 금지 동작 뒤에 긍정 동작이 오는 문장
  { text: '청기 올리지 말고, 청기 내려!', answer: 1 },
  { text: '청기 올리지 말고, 백기 올려!', answer: 2 },
  { text: '청기 올리지 말고, 백기 내려!', answer: 3 },
  { text: '청기 내리지 말고, 청기 올려!', answer: 0 },
  { text: '청기 내리지 말고, 백기 올려!', answer: 2 },
  { text: '청기 내리지 말고, 백기 내려!', answer: 3 },
  { text: '백기 올리지 말고, 청기 올려!', answer: 0 },
  { text: '백기 올리지 말고, 청기 내려!', answer: 1 },
  { text: '백기 올리지 말고, 백기 내려!', answer: 3 },
  { text: '백기 내리지 말고, 청기 올려!', answer: 0 },
  { text: '백기 내리지 말고, 청기 내려!', answer: 1 },
  { text: '백기 내리지 말고, 백기 올려!', answer: 2 },
];

export const dirs: Direction[] = ['up', 'down', 'left', 'right'];
export const controlDirs: Direction[] = ['up', 'left', 'down', 'right'];
export const glyph = (direction: Direction) =>
  direction === 'up' ? '↑' : direction === 'down' ? '↓' : direction === 'left' ? '←' : '→';
export const limits = [270, 260, 250, 240, 230, 220, 210, 200, 190, 180];
export const initial: State = {
  mode: 'home',
  stage: 0,
  practice: false,
  scores: [null, null, null, null, null, null],
  run: 0,
  stageRun: 0,
  gameData: null,
};

export function scoreProfile(average: number) {
  const age = Math.max(14, Math.min(60, Math.round(60 - average * 0.46)));
  const grade =
    average >= 100
      ? '역대급 천재 괴물'
      : average >= 90
        ? '프로게이머'
        : average >= 80
          ? '마스터 플레이어'
          : average >= 70
            ? '동네 고수'
            : average >= 60
              ? '준수한 피지컬'
              : average >= 50
                ? '평범한 피지컬'
                : average >= 40
                  ? '아쉬운 피지컬'
                  : average >= 30
                    ? '게임은 보기만 해요'
                    : '키보드가 고장났나요?..';

  return {
    ageDisplay: age === 60 ? '60세 이상' : `${age}세`,
    grade,
  };
}
