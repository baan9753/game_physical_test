import {
  dirs,
  flags,
  initial,
  limits,
  swatterGeometry,
  timerGradeFromScore,
  timerScoreFromError,
} from './game-data';
import type { Action, Direction, Orb, Particle, Stage, State } from './game-types';
import type { GameSoundEffect } from './game-sound';

// 충돌 애니메이션은 즉시 시작하고, 결과 판정 화면은 이 시간만큼 유지한 뒤 표시합니다.
const GOLEM_HIT_RESULT_DELAY = 0.5;

export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
function rand(seed: number, n: number) {
  const v = Math.sin(seed * 9517 + n * 7823) * 43758.5453;
  return v - Math.floor(v);
}
function seq(seed: number, length: number, values: number[] = []): Direction[] {
  return Array.from(
    { length },
    (_, i) => dirs.at(Math.floor((values.at(i) ?? rand(seed, i + 1)) * 4)) ?? 'up',
  );
}
type BurstKind = 'warning' | 'dust' | 'flash' | 'impact' | 'dodge' | 'rocket';
function burst(
  sample: () => number,
  kind: BurstKind,
  x: number,
  y: number,
  count: number,
  colors: string[],
): Particle[] {
  const between = (min: number, max: number) => min + sample() * (max - min);
  return Array.from({ length: count }, (_, i) => {
    let px = x,
      py = y,
      vx = 0,
      vy = 0,
      life = 0,
      size = 0;
    if (kind === 'warning') {
      px += between(-24, 24);
      py += between(-8, 18);
      vx = between(-18, 18);
      vy = between(-70, -25);
      life = 0.34;
      size = between(3, 6);
    } else if (kind === 'dust') {
      vx = between(-80, 95);
      vy = between(-45, 45);
      life = 0.35;
      size = between(3, 7);
    } else if (kind === 'flash') {
      vx = between(-130, 130);
      vy = between(-150, 150);
      life = 0.38;
      size = between(3, 7);
    } else if (kind === 'impact') {
      vx = between(-160, 160);
      vy = between(-180, 20);
      life = 0.65;
      size = between(3, 9);
    } else if (kind === 'dodge') {
      vx = between(-130, 130);
      vy = between(-100, 100);
      life = 0.45;
      size = between(3, 8);
    } else {
      const angle = between(0, Math.PI * 2),
        speed = between(45, 170);
      vx = Math.cos(angle) * speed;
      vy = Math.sin(angle) * speed - 35;
      life = between(0.22, 0.52);
      size = between(2, 5);
    }
    return {
      x: px,
      y: py,
      vx,
      vy,
      life,
      max: life,
      size,
      color: colors.at(i % colors.length) ?? '#ffffff',
    };
  });
}
function stageInitial(stage: number, r: number, randoms: number[] = []): Stage {
  return {
    elapsed: 0,
    score: 0,
    phase: 'wait',
    phaseAt: 0,
    impactAt: -1,
    wait: 0.55,
    warning: 0.75 + (randoms.at(0) ?? rand(r, 2)) * 2.25,
    round: 1,
    lives: 5,
    success: 0,
    failures: 0,
    golemResultX: 732,
    reactions: [],
    reactionStartedAt: 0,
    used: false,
    lateReactionRecorded: false,
    readyAt: 0,
    caught: 0,
    clicks: 0,
    target: {
      x: 400,
      y: 220,
      vx: ((randoms.at(1) ?? rand(r, 3)) - 0.5) * 170,
      vy: ((randoms.at(2) ?? rand(r, 4)) - 0.5) * 120,
    },
    x: 400,
    y: 230,
    held: { up: false, down: false, left: false, right: false },
    orbs: [],
    lastSpawn: 0,
    wave: 0,
    dodged: 0,
    nearMisses: 0,
    correct: 0,
    wrong: 0,
    raw: 0,
    flag: Math.floor((randoms.at(3) ?? rand(r, 5)) * flags.length),
    previous: -1,
    answerAt: 0,
    lastAction: -1,
    blueAngle: 90,
    whiteAngle: 90,
    pointerX: 400,
    pointerY: 220,
    pointerInside: false,
    swingAt: -1,
    dead: [],
    rocketAt: -1,
    launchAt: -1,
    rocketKind: '',
    keyAt: -1,
    keyIndex: -1,
    particles: [],
    lastFx: 0,
    flashAt: -1,
    trial: 0,
    active: false,
    timerStart: 0,
    measurements: [],
    timerScores: [],
    sequence: seq(r, 4, randoms.slice(4, 8)),
    step: 0,
    rockets: 0,
    misses: 0,
    length: 4,
    message: stage === 4 ? '측정을 시작하세요' : '',
    feedback: '',
  };
}
function finish(state: State, d: Stage, score: number, message: string): State {
  const scores = [...state.scores];
  scores.splice(state.stage, 1, Math.round(clamp(score, 0, 100)));
  return {
    ...state,
    mode: 'complete',
    scores,
    gameData: { ...d, score: Math.round(clamp(score, 0, 100)), message },
  };
}
function golemFail(
  d: Stage,
  message: string,
  feedback = '기회 1회를 잃고 같은 거리 구간을 다시 시도합니다.',
): Stage {
  const start = 732 - ((d.round - 1) * 400) / 9,
    budget = limits.at(d.round - 1) ?? 180,
    golemResultX =
      d.phase === 'hit'
        ? d.golemResultX
        : d.phase === 'charge'
        ? clamp(
            start - ((start - 150) * Math.max(0, d.elapsed - d.phaseAt)) / (budget / 1000),
            150,
            start,
          )
        : start;
  return {
    ...d,
    phase: 'result',
    phaseAt: d.elapsed,
    golemResultX,
    lives: Math.max(0, d.lives - 1),
    failures: d.failures + 1,
    message,
    feedback,
    used: false,
  };
}
function golemHit(d: Stage, feedback: string): Stage {
  return {
    ...d,
    phase: 'hit',
    phaseAt: d.elapsed,
    impactAt: d.elapsed,
    golemResultX: 150,
    message: '피격!',
    feedback,
    used: false,
    // 피격 직전 입력의 섬광이 남아 피격 후 안전 연출처럼 보이지 않게 초기화합니다.
    flashAt: -1,
    lateReactionRecorded: false,
  };
}
export function reducer(s: State, a: Action): State {
  const r = a.random ?? 0.5;
  let sampleIndex = 0;
  const sample = () => {
    const index = sampleIndex++;
    return a.randoms?.at(index) ?? rand(r, index + 1);
  };
  const sequence = (length: number) =>
    seq(
      r,
      length,
      Array.from({ length }, () => sample()),
    );
  if (a.type === 'home') return { ...initial, run: s.run };
  if (a.type === 'begin')
    return {
      ...initial,
      mode: 'intro',
      practice: !!a.practice,
      stage: a.stage ?? 0,
      run: s.run + 1,
    };
  if (a.type === 'intro') return { ...s, mode: 'intro', stage: a.stage ?? 0 };
  if (a.type === 'start')
    return {
      ...s,
      mode: 'countdown',
      stageRun: s.stageRun + 1,
      gameData: stageInitial(s.stage, r, a.randoms),
    };
  if (a.type === 'pause' && ['play', 'countdown'].includes(s.mode))
    return {
      ...s,
      mode: 'pause',
      gameData: s.gameData
        ? {
            ...s.gameData,
            elapsed: s.gameData.elapsed + (s.mode === 'play' ? Math.max(0, a.offset ?? 0) : 0),
            readyAt: s.gameData.readyAt + (s.mode === 'countdown' ? Math.max(0, a.offset ?? 0) : 0),
            held: { up: false, down: false, left: false, right: false },
          }
        : null,
    };
  if (a.type === 'resume' && s.mode === 'pause') {
    const resumePlay = !!s.gameData && s.gameData.readyAt >= 3;
    return {
      ...s,
      mode: resumePlay ? 'play' : 'countdown',
      gameData:
        resumePlay && s.stage === 4 && s.gameData && !s.gameData.active && s.gameData.trial === 0
          ? { ...s.gameData, active: true, timerStart: s.gameData.elapsed, message: '측정 중' }
          : s.gameData,
    };
  }
  if (a.type === 'next' && s.mode === 'complete') {
    if (s.practice) return { ...initial, run: s.run };
    if (s.stage < 5) return { ...s, stage: s.stage + 1, mode: 'intro' };
    return { ...s, mode: 'results' };
  }
  const d = s.gameData;
  if (!d) return s;
  if (a.type === 'tick') {
    if (s.mode === 'countdown') {
      const readyAt = d.readyAt + (a.dt ?? 0),
        starting = readyAt >= 3;
      const next = {
        ...d,
        readyAt,
        ...(starting && s.stage === 4 ? { active: true, timerStart: 0, message: '측정 중' } : {}),
      };
      return { ...s, mode: starting ? 'play' : 'countdown', gameData: next };
    }
    if (s.mode !== 'play') return s;
    const dt = Math.max(0, a.dt ?? 0),
      moveDt = Math.min(0.05, dt);
    let n: Stage = {
      ...d,
      elapsed: d.elapsed + dt,
      particles: d.particles
        .map((p) => ({
          ...p,
          x: p.x + p.vx * moveDt,
          y: p.y + p.vy * moveDt,
          vy: p.vy + (s.stage === 5 ? 180 : 170) * moveDt,
          life: p.life - moveDt,
        }))
        .filter((p) => p.life > 0),
    };
    if (s.stage === 0) {
      const budget = limits.at(n.round - 1) ?? 180;
      const start = 732 - ((n.round - 1) * 400) / 9,
        gx =
          n.phase === 'charge'
            ? start - ((start - 150) * (n.elapsed - n.phaseAt)) / (budget / 1000)
            : start;
      if (n.phase === 'warning' && n.elapsed - n.lastFx > 0.13)
        n = {
          ...n,
          lastFx: n.elapsed,
          particles: [
            ...n.particles,
            ...burst(sample, 'warning', gx, 205, 2, ['#ffd15c', '#ff7348']),
          ],
        };
      else if (n.phase === 'charge' && sample() < Math.min(1, moveDt * 18))
        n = {
          ...n,
          particles: [...n.particles, ...burst(sample, 'dust', gx + 22, 248, 1, ['#c39b68'])],
        };
      if (n.phase === 'hit') {
        // 첫 입력이 기록되면 즉시, 입력이 없으면 500ms 뒤 실패 결과를 보여줍니다.
        if (n.lateReactionRecorded || n.elapsed - n.phaseAt >= GOLEM_HIT_RESULT_DELAY)
          n = golemFail(n, n.message, n.feedback);
      } else if (n.phase === 'wait' && n.elapsed - n.phaseAt >= n.wait)
        n = { ...n, phase: 'warning', phaseAt: n.elapsed };
      else if (n.phase === 'warning' && n.elapsed - n.phaseAt >= n.warning)
        n = {
          ...n,
          phase: 'charge',
          phaseAt: n.elapsed,
          reactionStartedAt: n.elapsed,
        };
      else if (
        n.phase === 'charge' &&
        n.elapsed - n.phaseAt >=
          (budget / 1000) *
            (n.used ? (740 - (n.round - 1) * (400 / 9)) / (582 - (n.round - 1) * (400 / 9)) : 1)
      ) {
        if (n.used)
          n = {
            ...n,
            phase: 'result',
            phaseAt: n.elapsed,
            golemResultX: -8,
            success: n.success + 1,
            score: (n.success + 1) * 10,
            particles: [...n.particles, ...burst(sample, 'dodge', -8, 230, 15, ['#a79672'])],
            message: '회피 성공!',
            feedback: `반응속도 ${Math.round(n.reactions.at(-1) ?? 0)}ms · 제한 ${budget}ms 통과`,
          };
        else
          n = {
            ...golemHit(n, `반응 입력 없음 · 제한 ${budget}ms`),
            particles: [
              ...n.particles,
              ...burst(sample, 'impact', 92, 230, 22, ['#aa9473', '#f05a51']),
            ],
          };
      } else if (n.phase === 'result' && n.elapsed - n.phaseAt >= 1.5) {
        if (n.lives <= 0 || (n.round === 10 && n.used))
          return finish(s, n, n.success * 10, `성공 ${n.success} / 10 · 실패 ${n.failures}회`);
        n = {
          ...n,
          round: n.used ? n.round + 1 : n.round,
          phase: 'wait',
          phaseAt: n.elapsed,
          impactAt: -1,
          wait: 0.55,
          warning: 0.75 + sample() * 2.25,
          lateReactionRecorded: false,
          used: false,
          message: '',
          feedback: '',
        };
      }
    }
    if (s.stage === 1) {
      n = { ...n, dead: n.dead.filter((v) => n.elapsed - v.at < 0.48) };
      let { x, y, vx, vy } = n.target;
      x += vx * moveDt * (1 + (n.elapsed / 20) * 0.3);
      y += vy * moveDt * (1 + (n.elapsed / 20) * 0.3);
      // 경계를 넘은 위치를 반사시켜 모기가 한 프레임이라도 화면 밖에 그려지지 않게 합니다.
      if (x < 40) {
        x = 80 - x;
        vx = Math.abs(vx);
      } else if (x > 760) {
        x = 1520 - x;
        vx = -Math.abs(vx);
      }
      if (y < 65) {
        y = 130 - y;
        vy = Math.abs(vy);
      } else if (y > 410) {
        y = 820 - y;
        vy = -Math.abs(vy);
      }
      x = clamp(x, 40, 760);
      y = clamp(y, 65, 410);
      n = { ...n, target: { x, y, vx, vy } };
      if (n.elapsed >= 20)
        return finish(
          s,
          n,
          n.clicks ? Math.min(100, ((n.caught * n.caught) / n.clicks / 40) * 100) : 0,
          `포획 ${n.caught}마리 · 초당 ${(n.caught / 20).toFixed(1)}마리 · 정확도 ${n.clicks ? Math.round((n.caught / n.clicks) * 100) : 0}%`,
        );
    }
    if (s.stage === 2) {
      const aimX = n.x,
        aimY = n.y,
        dx = Number(n.held.right) - Number(n.held.left),
        dy = Number(n.held.down) - Number(n.held.up),
        length = Math.hypot(dx, dy) || 1;
      n = {
        ...n,
        x: clamp(n.x + (dx / length) * 240 * moveDt, 25, 775),
        y: clamp(n.y + (dy / length) * 240 * moveDt, 55, 425),
      };
      const elapsed = n.elapsed,
        // 초반에는 한 발씩 여유 있게 피하고, 생존 시간이 길어질수록 발사 간격과 패턴을 단계적으로 올립니다.
        difficulty = clamp(elapsed / 40, 0, 1),
        speed = 170 + difficulty * 180,
        interval = Math.max(0.36, 1.0 - difficulty * 0.64);
      let orbs = n.orbs;
      if (elapsed - n.lastSpawn >= interval && orbs.length < 140) {
        const side = Math.floor(sample() * 4),
          ox = side === 0 ? 0 : side === 1 ? 800 : sample() * 640 + 80,
          oy = side === 2 ? 0 : side === 3 ? 450 : sample() * 290 + 80,
          angle = Math.atan2(aimY - oy, aimX - ox),
          unlockedPatterns = elapsed < 8 ? 1 : elapsed < 18 ? 2 : elapsed < 28 ? 3 : 4,
          pattern = n.wave % unlockedPatterns;
        const spawn = (x: number, y: number, a: number, v: number): Orb => {
          const velocity = v + sample() * 36 - 18;
          return { x, y, vx: Math.cos(a) * velocity, vy: Math.sin(a) * velocity, near: false };
        };
        if (pattern === 0) orbs = [...orbs, spawn(ox, oy, angle, speed)];
        else if (pattern === 1) {
          const count = 2 + Math.floor(difficulty * 3),
            spread = Array.from({ length: count }, (_, i) => (i - (count - 1) / 2) * 0.18);
          orbs = [
            ...orbs,
            ...spread.map((delta) => spawn(ox, oy, angle + delta, speed * 0.9)),
          ];
        } else if (pattern === 2) {
          const down = sample() < 0.5,
            edge = down ? 0 : 450,
            angle = down ? Math.PI / 2 : -Math.PI / 2,
            count = 3 + Math.floor(difficulty * 4),
            spacing = 800 / (count + 1);
          orbs = [
            ...orbs,
            ...Array.from({ length: count }, (_, i) => spawn(spacing * (i + 1), edge, angle, speed * 0.8)),
          ];
        } else {
          const count = 2 + Math.floor(difficulty * 2);
          orbs = [
            ...orbs,
            spawn(0, 0, Math.atan2(aimY, aimX), speed),
            spawn(800, 450, Math.atan2(aimY - 450, aimX - 800), speed),
            ...(count >= 3 ? [spawn(0, 450, Math.atan2(aimY - 450, aimX), speed * 0.9)] : []),
            ...(count >= 4 ? [spawn(800, 0, Math.atan2(aimY, aimX - 800), speed * 0.9)] : []),
          ];
        }
        n = { ...n, lastSpawn: elapsed, wave: n.wave + 1 };
      }
      orbs = orbs.map((o) => ({ ...o, x: o.x + o.vx * moveDt, y: o.y + o.vy * moveDt }));
      if (orbs.some((o) => Math.hypot(o.x - n.x, o.y - n.y) < 16))
        return finish(
          s,
          n,
          (Math.min(40, elapsed) / 40) * 100,
          `생존 ${elapsed.toFixed(1)}초 · 피한 탄환 ${n.dodged}개`,
        );
      let nearHits = 0;
      orbs = orbs.map((o) => {
        if (!o.near && Math.hypot(o.x - n.x, o.y - n.y) < 30) {
          nearHits++;
          return { ...o, near: true };
        }
        return o;
      });
      n = { ...n, nearMisses: n.nearMisses + nearHits };
      const visible = orbs.filter((o) => o.x >= -20 && o.x <= 820 && o.y >= -20 && o.y <= 470);
      n = {
        ...n,
        orbs: visible,
        dodged: n.dodged + orbs.length - visible.length,
        score: Math.min(100, Math.round((elapsed / 40) * 100)),
      };
      if (elapsed >= 40) return finish(s, n, 100, `생존 40초 · 피한 탄환 ${n.dodged}개`);
    }
    if (s.stage === 3) {
      const blue =
          n.answerAt && (n.lastAction === 0 || n.lastAction === 1)
            ? n.lastAction === 0
              ? 45
              : 135
            : 90,
        white =
          n.answerAt && (n.lastAction === 2 || n.lastAction === 3)
            ? n.lastAction === 2
              ? 45
              : 135
            : 90;
      n = {
        ...n,
        blueAngle: n.blueAngle + (blue - n.blueAngle) * Math.min(1, moveDt * 12),
        whiteAngle: n.whiteAngle + (white - n.whiteAngle) * Math.min(1, moveDt * 12),
      };
      if (n.answerAt && n.elapsed - n.answerAt >= 0.42) {
        const prior = n.flag;
        let next = Math.floor(sample() * (flags.length - 1));
        if (next >= prior) next++;
        n = {
          ...n,
          flag: next,
          previous: prior,
          phaseAt: n.elapsed,
          answerAt: 0,
          lastAction: -1,
          message: '',
        };
      }
      if (n.elapsed >= 30)
        return finish(s, n, clamp(n.raw, 0, 100), `정답 ${n.correct}회 · 오답 ${n.wrong}회`);
    }
    if (s.stage === 5 && n.elapsed >= 30)
      return finish(
        s,
        n,
        Math.min(100, (n.rockets / 20) * 100),
        `로켓 발사 ${n.rockets}회 · 불발 ${n.misses}회`,
      );
    return { ...s, gameData: n };
  }
  if (s.mode !== 'play') return s;
  if (a.type === 'hover' && s.stage === 1)
    return {
      ...s,
      gameData: { ...d, pointerX: a.x ?? 0, pointerY: a.y ?? 0, pointerInside: true },
    };
  if (a.type === 'leave' && s.stage === 1)
    return { ...s, gameData: { ...d, pointerInside: false } };
  if (a.type === 'pointer' && s.stage === 1) {
    const anchorX = a.x ?? 0,
      anchorY = a.y ?? 0,
      hit = Math.hypot(anchorX - d.target.x, anchorY - d.target.y) <= swatterGeometry.hitRadius;
    const caught = d.caught + (hit ? 1 : 0),
      clicks = d.clicks + 1;
    return {
      ...s,
      gameData: {
        ...d,
        caught,
        clicks,
        pointerX: a.x ?? 0,
        pointerY: a.y ?? 0,
        pointerInside: true,
        swingAt: d.elapsed,
        dead: hit ? [...d.dead, { x: d.target.x, y: d.target.y, at: d.elapsed }] : d.dead,
        score: Math.round(Math.min(100, ((caught * caught) / clicks / 40) * 100)),
        target: hit
          ? {
              x: 65 + sample() * 670,
              y: 95 + sample() * 290,
              vx: (sample() - 0.5) * 220,
              vy: (sample() - 0.5) * 160,
            }
          : d.target,
      },
    };
  }
  if ((a.type === 'move' || a.type === 'stop') && s.stage === 2 && a.direction) {
    const active = a.type === 'move';
    return {
      ...s,
      gameData: {
        ...d,
        held: {
          ...d.held,
          up: a.direction === 'up' ? active : d.held.up,
          down: a.direction === 'down' ? active : d.held.down,
          left: a.direction === 'left' ? active : d.held.left,
          right: a.direction === 'right' ? active : d.held.right,
        },
      },
    };
  }
  if (a.type !== 'action') return s;
  if (s.stage === 0) {
    const now: Stage = { ...d, elapsed: d.elapsed + Math.max(0, a.offset ?? 0) };
    if (now.phase === 'wait' || now.phase === 'warning')
      return {
        ...s,
        gameData: {
          ...golemFail(
            now,
            '예측 실패!',
            '돌진 시작 전에 입력했어요. 기회 1회를 잃고 같은 구간을 다시 시도합니다.',
          ),
          particles: [
            ...d.particles,
            ...burst(sample, 'impact', 92, 230, 22, ['#aa9473', '#f05a51']),
          ],
          // 프레임 사이 입력 시각을 보존해 이후 대기 시간이 어긋나지 않게 합니다.
          elapsed: now.elapsed,
        },
      };
    if (now.phase === 'hit') {
      // 피격은 확정된 상태로 유지하고, 500ms 결과 대기 중 첫 입력의 반응 시간만 기록합니다.
      // 점멸/안전 연출이나 회피 성공 카운트는 절대 변경하지 않습니다.
      if (now.lateReactionRecorded) return s;
      const ms = Math.max(0, (now.elapsed - now.reactionStartedAt) * 1000),
        budget = limits.at(now.round - 1) ?? 180;
      return {
        ...s,
        gameData: {
          ...now,
          lateReactionRecorded: true,
          reactions: [...now.reactions, ms],
          feedback: `반응속도 ${Math.round(ms)}ms · 제한 ${budget}ms · 피격`,
        },
      };
    }
    if (now.phase !== 'charge' || now.used) return s;
    const budget = limits.at(now.round - 1) ?? 180,
      ms = (now.elapsed - now.phaseAt) * 1000;
    if (ms < 100 - 1e-7 || ms > budget + 1e-7)
      return {
        ...s,
        gameData: {
          ...(ms < 100 - 1e-7
            ? golemFail(
                now,
                '예측 실패!',
                `반응속도 ${Math.round(ms)}ms · 100ms 미만 입력은 예측으로 처리됩니다.`,
              )
            : {
                ...golemHit(
                  now,
                  `반응속도 ${Math.round(ms)}ms · 제한 ${budget}ms를 넘겨 돌진에 맞았습니다.`,
                ),
                // 제한을 넘겼어도 실제 입력이 있었으므로 유효 반응 기록에 포함합니다.
                reactions: [...now.reactions, ms],
                lateReactionRecorded: true,
              }),
          particles: [
            ...d.particles,
            ...burst(sample, 'impact', 92, 230, 22, ['#aa9473', '#f05a51']),
          ],
          // 충돌 입력의 프레임 오프셋을 유지해 피격부터 결과까지 정확히 500ms를 잽니다.
          elapsed: now.elapsed,
        },
      };
    return {
      ...s,
      gameData: {
        ...now,
        elapsed: d.elapsed,
        used: true,
        flashAt: d.elapsed,
        particles: [...d.particles, ...burst(sample, 'flash', 92, 230, 22, ['#fff2a8', '#ffe477'])],
        reactions: [...now.reactions, ms],
        message: `${Math.round(ms)}ms 회피`,
      },
    };
  }
  if (s.stage === 3) {
    if (d.answerAt) return s;
    const good = flags.at(d.flag)?.answer === a.value,
      raw = d.raw + (good ? 5 : -3);
    return {
      ...s,
      gameData: {
        ...d,
        raw,
        score: clamp(raw, 0, 100),
        correct: d.correct + (good ? 1 : 0),
        wrong: d.wrong + (good ? 0 : 1),
        answerAt: d.elapsed || 0.001,
        lastAction: a.value ?? -1,
        message: good ? '정답입니다!' : '오답입니다.',
      },
    };
  }
  if (s.stage === 4) {
    if (!d.active) {
      if (d.trial >= 3) return finish(s, d, d.score, `3회 평균 ${d.score}점`);
      return {
        ...s,
        gameData: {
          ...d,
          active: true,
          timerStart: d.elapsed + Math.max(0, a.offset ?? 0),
          message: '측정 중',
        },
      };
    }
    const elapsed = d.elapsed + Math.max(0, a.offset ?? 0) - d.timerStart,
      error = Math.abs(elapsed - 10),
      points = timerScoreFromError(error);
    const scores = [...d.timerScores, points],
      measurements = [...d.measurements, elapsed],
      score = Math.round(scores.reduce((x, y) => x + y, 0) / scores.length);
    return {
      ...s,
      gameData: {
        ...d,
        active: false,
        trial: d.trial + 1,
        timerScores: scores,
        measurements,
        score,
        message: `${elapsed.toFixed(2)}초 · 오차 ${error.toFixed(2)}초 ${elapsed < 10 ? '빨랐어요' : '늦었어요'} · ${timerGradeFromScore(points)} (${points}점)`,
      },
    };
  }
  if (s.stage === 5) {
    const good = d.sequence.at(d.step) === a.direction;
    if (!good)
      return {
        ...s,
        gameData: {
          ...d,
          misses: d.misses + 1,
          rocketAt: d.elapsed,
          rocketKind: 'fail',
          keyIndex: -1,
          particles: [
            ...d.particles,
            ...burst(sample, 'rocket', 400, 100, 12, ['#ff6155', '#ffab55']),
          ],
          step: 0,
          sequence: sequence(d.length),
          message: `틀렸어요! ${d.length}개 묶음으로 다시 도전`,
        },
      };
    if (d.step + 1 >= d.length) {
      const rockets = d.rockets + 1,
        length = Math.min(10, 4 + Math.floor(rockets / 2));
      return {
        ...s,
        gameData: {
          ...d,
          rockets,
          length,
          rocketAt: d.elapsed,
          launchAt: d.elapsed,
          rocketKind: 'success',
          keyIndex: -1,
          particles: [
            ...d.particles,
            ...burst(
              sample,
              'rocket',
              400 -
                (Math.min(66, 680 / d.length) * (d.length - 1)) / 2 +
                Math.min(66, 680 / d.length) * d.step,
              100,
              12,
              ['#c8f36a', '#ffe477', '#ffffff'],
            ),
            ...burst(sample, 'rocket', 400, 326, 34, ['#c8f36a', '#ffe477', '#ffffff', '#ff994a']),
          ],
          score: Math.min(100, Math.round((rockets / 20) * 100)),
          step: 0,
          sequence: sequence(length),
          message: '성공! 로켓 발사',
        },
      };
    }
    return {
      ...s,
      gameData: {
        ...d,
        keyAt: d.elapsed,
        keyIndex: d.step,
        rocketKind: '',
        particles: [
          ...d.particles,
          ...burst(
            sample,
            'rocket',
            400 -
              (Math.min(66, 680 / d.length) * (d.length - 1)) / 2 +
              Math.min(66, 680 / d.length) * d.step,
            100,
            12,
            ['#c8f36a', '#ffe477', '#ffffff'],
          ),
        ],
        step: d.step + 1,
        message: `정답! ${d.step + 1} / ${d.length}`,
      },
    };
  }
  return s;
}
export function inputSounds(before: State, after: State): GameSoundEffect[] {
  const old = before.gameData,
    d = after.gameData;
  if (!old || !d || before.mode !== 'play') return [];
  if (before.stage === 0) {
    // 피격 상태에서는 회피/점멸 효과음을 차단합니다.
    if (d.phase === 'hit') return old.phase === 'hit' ? [] : ['impact'];
    if (!old.used && d.used && d.phase !== 'hit') return ['flash'];
    if (d.failures > old.failures) return ['impact'];
  }
  if (before.stage === 1 && d.clicks > old.clicks)
    return ['swat', d.caught > old.caught ? 'mosquito' : 'miss'];
  if (before.stage === 3) {
    if (d.correct > old.correct) return ['correct'];
    if (d.wrong > old.wrong) return ['wrong'];
  }
  if (before.stage === 4) {
    if (!old.active && d.active) return ['timer'];
    if (d.trial > old.trial) {
      const score = d.timerScores.at(-1) ?? 0;
      if (score === 100) return ['perfect'];
      if (score >= 90) return ['complete'];
      if (score >= 80) return ['correct'];
      if (score >= 70) return ['timer'];
      if (score >= 60) return ['wrong'];
      return ['miss'];
    }
  }
  if (before.stage === 5) {
    if (d.misses > old.misses) return ['wrong'];
    if (d.rockets > old.rockets) return ['correct'];
    if (d.step > old.step) return ['rocketKey'];
  }
  return [];
}
export function hud(stage: number, d: Stage, counting: boolean) {
  if (counting)
    return [
      `시작까지 ${Math.max(1, Math.ceil(3 - d.readyAt))}초`,
      '준비하세요',
      '3초 뒤 시작합니다',
    ];
  if (stage === 0) {
    const limit = limits.at(d.round - 1) ?? 180,
      gap = Math.round(640 - ((d.round - 1) * 400) / 9);
    return [
      `라운드 ${d.round} / 10 · 기회 ${d.lives} / 5`,
      d.phase === 'wait'
        ? `골렘 간격 ${gap}px · 제한 ${limit}ms`
        : d.phase === 'warning'
          ? `위험 표시 · 곧 돌진합니다 · ${limit}ms`
          : d.phase === 'charge'
            ? `돌진! ${limit}ms 안에 피하세요`
            : d.message,
      'D / F 또는 아래 점멸 버튼',
    ];
  }
  if (stage === 1)
    return [
      `남은 시간 ${Math.max(0, 20 - d.elapsed).toFixed(1)}초`,
      `포획 ${d.caught}마리 · 초당 ${(d.caught / Math.max(0.1, d.elapsed)).toFixed(1)}마리 · 정확도 ${d.clicks ? Math.round((d.caught / d.clicks) * 100) : 0}%`,
      '마우스 또는 터치',
    ];
  if (stage === 2)
    return [
      `생존 ${Math.min(40, d.elapsed).toFixed(1)} / 40초`,
      `피한 탄환 ${d.dodged}`,
      '방향키 또는 W A S D · 화면 버튼',
    ];
  if (stage === 3)
    return [
      `진행 ${d.correct + d.wrong}문항`,
      d.message || `정답 ${d.correct} · 오답 ${d.wrong} · 점수 ${d.score}점`,
      'W 청기 올리기 · S 청기 내리기 · O 백기 올리기 · K 백기 내리기',
    ];
  if (stage === 4)
    return [
      `측정 ${Math.min(3, d.trial + 1)} / 3`,
      d.active
        ? d.elapsed - d.timerStart < 3
          ? '처음 3초 타이머를 확인하세요'
          : '10초가 되면 눌러주세요'
        : d.message || '준비되면 측정을 시작하세요',
      '측정 중에는 화면 단서가 없습니다',
    ];
  return [
    `남은 시간 ${Math.max(0, 30 - d.elapsed).toFixed(1)}초`,
    `${d.message || '방향키를 순서대로 입력하세요'} · 발사 ${d.rockets} / 20`,
    '방향키 또는 화면 방향 버튼',
  ];
}
