export type Mode = 'home' | 'intro' | 'countdown' | 'play' | 'pause' | 'complete' | 'results';
export type Direction = 'up' | 'down' | 'left' | 'right';
export type Orb = { x: number; y: number; vx: number; vy: number; near: boolean };
export type Flag = { text: string; answer: number };
export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
};
export type Stage = {
  elapsed: number;
  score: number;
  phase: string;
  phaseAt: number;
  impactAt: number;
  wait: number;
  warning: number;
  round: number;
  lives: number;
  success: number;
  failures: number;
  golemResultX: number;
  reactions: number[];
  reactionStartedAt: number;
  used: boolean;
  lateReactionRecorded: boolean;
  readyAt: number;
  caught: number;
  clicks: number;
  target: { x: number; y: number; vx: number; vy: number };
  x: number;
  y: number;
  held: { up: boolean; down: boolean; left: boolean; right: boolean };
  orbs: Orb[];
  lastSpawn: number;
  wave: number;
  dodged: number;
  nearMisses: number;
  correct: number;
  wrong: number;
  raw: number;
  flag: number;
  previous: number;
  answerAt: number;
  lastAction: number;
  blueAngle: number;
  whiteAngle: number;
  pointerX: number;
  pointerY: number;
  pointerInside: boolean;
  swingAt: number;
  dead: { x: number; y: number; at: number }[];
  rocketAt: number;
  launchAt: number;
  rocketKind: string;
  keyAt: number;
  keyIndex: number;
  particles: Particle[];
  lastFx: number;
  flashAt: number;
  trial: number;
  active: boolean;
  timerStart: number;
  measurements: number[];
  timerScores: number[];
  sequence: Direction[];
  step: number;
  rockets: number;
  misses: number;
  length: number;
  message: string;
  feedback: string;
};
export type State = {
  mode: Mode;
  stage: number;
  practice: boolean;
  scores: (number | null)[];
  run: number;
  stageRun: number;
  gameData: Stage | null;
};
export type Action = {
  type:
    | 'home'
    | 'begin'
    | 'intro'
    | 'start'
    | 'pause'
    | 'resume'
    | 'next'
    | 'tick'
    | 'action'
    | 'pointer'
    | 'hover'
    | 'leave'
    | 'move'
    | 'stop';
  stage?: number;
  practice?: boolean;
  dt?: number;
  offset?: number;
  random?: number;
  randoms?: number[];
  value?: number;
  x?: number;
  y?: number;
  direction?: Direction;
};
