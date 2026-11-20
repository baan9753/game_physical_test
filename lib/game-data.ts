import { message, type Translate } from './game-copy';
import type { GameLocale } from './game-locale';
import type { Direction, Flag, State } from './game-types';

export const names = [
  '돌 골렘 피하기',
  '모기 잡기',
  '탄환 피하기',
  '청기 백기',
  '10초 맞추기',
  '방향키 로켓',
];
export const stageNames = ['golem', 'mosquito', 'dodge', 'flags', 'timer', 'rocket'] as const;
export const skillNames = ['reaction', 'aim', 'evasion', 'judgment', 'timing', 'speed'] as const;

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
  if (score === 100) return 'perfect';
  if (score >= 90) return 'great';
  if (score >= 80) return 'cool';
  if (score >= 70) return 'good';
  if (score >= 60) return 'bad';
  return 'miss';
}
export const guides = [
  ['golemRules', 'golemControls'],
  ['mosquitoRules', 'mosquitoControls'],
  ['dodgeRules', 'dodgeControls'],
  ['flagRules', 'flagControls'],
  ['timerRules', 'timerControls'],
  ['rocketRules', 'rocketControls'],
] as const;

export const flags: Flag[] = [
  // 1. 기본 단일 동작
  { text: '청기 올려!', answer: 0 },
  { text: '청기 내려!', answer: 1 },
  { text: '백기 올려!', answer: 2 },
  { text: '백기 내려!', answer: 3 },

  // 긍정 동작 뒤에 금지 동작이 오는 문장
  { text: '청기 올리고, 청기 내리지 마!', answer: 0, forbidden: 1 },
  { text: '청기 올리고, 백기 올리지 마!', answer: 0, forbidden: 2 },
  { text: '청기 올리고, 백기 내리지 마!', answer: 0, forbidden: 3 },
  { text: '청기 내리고, 청기 올리지 마!', answer: 1, forbidden: 0 },
  { text: '청기 내리고, 백기 올리지 마!', answer: 1, forbidden: 2 },
  { text: '청기 내리고, 백기 내리지 마!', answer: 1, forbidden: 3 },
  { text: '백기 올리고, 청기 올리지 마!', answer: 2, forbidden: 0 },
  { text: '백기 올리고, 청기 내리지 마!', answer: 2, forbidden: 1 },
  { text: '백기 올리고, 백기 내리지 마!', answer: 2, forbidden: 3 },
  { text: '백기 내리고, 청기 올리지 마!', answer: 3, forbidden: 0 },
  { text: '백기 내리고, 청기 내리지 마!', answer: 3, forbidden: 1 },
  { text: '백기 내리고, 백기 올리지 마!', answer: 3, forbidden: 2 },

  // 금지 동작 뒤에 긍정 동작이 오는 문장
  { text: '청기 올리지 말고, 청기 내려!', answer: 1, forbidden: 0, forbiddenFirst: true },
  { text: '청기 올리지 말고, 백기 올려!', answer: 2, forbidden: 0, forbiddenFirst: true },
  { text: '청기 올리지 말고, 백기 내려!', answer: 3, forbidden: 0, forbiddenFirst: true },
  { text: '청기 내리지 말고, 청기 올려!', answer: 0, forbidden: 1, forbiddenFirst: true },
  { text: '청기 내리지 말고, 백기 올려!', answer: 2, forbidden: 1, forbiddenFirst: true },
  { text: '청기 내리지 말고, 백기 내려!', answer: 3, forbidden: 1, forbiddenFirst: true },
  { text: '백기 올리지 말고, 청기 올려!', answer: 0, forbidden: 2, forbiddenFirst: true },
  { text: '백기 올리지 말고, 청기 내려!', answer: 1, forbidden: 2, forbiddenFirst: true },
  { text: '백기 올리지 말고, 백기 내려!', answer: 3, forbidden: 2, forbiddenFirst: true },
  { text: '백기 내리지 말고, 청기 올려!', answer: 0, forbidden: 3, forbiddenFirst: true },
  { text: '백기 내리지 말고, 청기 내려!', answer: 1, forbidden: 3, forbiddenFirst: true },
  { text: '백기 내리지 말고, 백기 올려!', answer: 2, forbidden: 3, forbiddenFirst: true },
];

export const flagControls = ['blueUp', 'blueDown', 'whiteUp', 'whiteDown'] as const;
const forbiddenActions = ['flagDontBlueUp', 'flagDontBlueDown', 'flagDontWhiteUp', 'flagDontWhiteDown'] as const;

export function flagPrompt(index: number, locale: GameLocale, t: Translate) {
  const flag = flags[index];
  if (!flag) return '';
  if (locale === 'ko') return flag.text;
  const action = t(flagControls[flag.answer]);
  if (flag.forbidden === undefined) return t('flagCommand', { action });
  const forbidden = t(forbiddenActions[flag.forbidden]);
  return t(flag.forbiddenFirst ? 'flagDontFirst' : 'flagDoFirst', {
    action,
    forbidden,
    negative: forbidden,
  });
}

export function visibleFlagCharacters(index: number, elapsed: number, promptLength: number) {
  const referenceLength = flags[index]?.text.length ?? 1;
  const progress = (Math.floor(Math.max(0, elapsed) * 24) + 1) / referenceLength;
  return Math.min(promptLength, Math.ceil(promptLength * progress));
}

export function timingDetails(elapsed: number, score: number) {
  return message('timingDetails', {
    direction: message(elapsed < 10 ? 'early' : elapsed > 10 ? 'late' : 'exact'),
    error: Math.abs(elapsed - 10).toFixed(2),
    grade: message(timerGradeFromScore(score)),
    score,
  });
}

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

export function scoreProfile(average: number, t: Translate) {
  const age = Math.max(14, Math.min(60, Math.round(60 - average * 0.46)));
  const grade =
    average >= 100
      ? 'grade100'
      : average >= 90
        ? 'grade90'
        : average >= 80
          ? 'grade80'
          : average >= 70
            ? 'grade70'
            : average >= 60
              ? 'grade60'
              : average >= 50
                ? 'grade50'
                : average >= 40
                  ? 'grade40'
                  : average >= 30
                    ? 'grade30'
                    : 'gradeLow';

  return {
    ageDisplay: age === 60 ? t('ageOver') : t('age', { age }),
    grade: t(grade),
  };
}
