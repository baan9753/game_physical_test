import { flagPrompt, glyph, limits, skillNames, swatterGeometry, visibleFlagCharacters } from './game-data';
import { formatMessage, type Translate } from './game-copy';
import type { GameLocale } from './game-locale';
import type { Direction, Stage } from './game-types';
import { clamp } from './game-engine';

// 파리채 타격 모션 설정 (2단계 모기 잡기). 값을 바꿔 느낌을 조절할 수 있습니다.
const SWAT_SCALE_MIN = 0.72; // 타격 순간 최소 크기 (1 = 원래 크기)
const SWAT_ROTATION_DEG = -14; // 타격 순간 회전 각도 (음수 = 반시계 방향)
const SWAT_HIT_AT = 0.3; // 전체 모션 중 타격 지점 비율 (0~1). 이 지점까지 작아지고 이후 돌아옵니다.
const SWAT_DRAW_SCALE = 0.74; // 포인터 중심은 유지하며 파리채 외형만 축소합니다.

/** 타격 진행도(0~1)를 "타격 세기"(0~1)로 변환합니다. 타격 지점에서 1, 시작/끝에서 0이며 복귀 시 살짝 튕깁니다. */
function swatAmount(progress: number) {
  if (progress < SWAT_HIT_AT) {
    // 내려칠 때: 빠르게 작아지고 회전 (ease-out cubic)
    const u = progress / SWAT_HIT_AT;
    return 1 - Math.pow(1 - u, 3);
  }
  // 돌아올 때: 다시 커지면서 원래 각도로 복귀 (ease-out back → 약간 지나쳤다가 안착)
  const u = (progress - SWAT_HIT_AT) / (1 - SWAT_HIT_AT),
    c1 = 1.4,
    c3 = c1 + 1,
    back = 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
  return 1 - back;
}

export function paint(ctx: CanvasRenderingContext2D, stage: number, d: Stage, counting: boolean, locale: GameLocale, t: Translate) {
  const time = d.elapsed;
  function pixelText(
    value: string | number,
    x: number,
    y: number,
    size: number,
    color: string,
    align: CanvasTextAlign = 'left',
    maxWidth?: number,
  ) {
    ctx.save();
    ctx.font = `700 ${size}px "Noto Sans KR", "Apple SD Gothic Neo", sans-serif`;
    ctx.imageSmoothingEnabled = true;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    if (maxWidth) ctx.fillText(String(value), x, y, maxWidth);
    else ctx.fillText(String(value), x, y);
    ctx.restore();
  }
  function box(x: number, y: number, w: number, h: number, c: string) {
    ctx.fillStyle = c;
    ctx.fillRect(
      Math.round(x),
      Math.round(y),
      Math.max(1, Math.round(w)),
      Math.max(1, Math.round(h)),
    );
  }
  function drawBg() {
    box(0, 0, 800, 450, '#263722');
    for (let y = 0; y < 450; y += 24) {
      for (let x = 0; x < 800; x += 32) {
        const k = (Math.floor(x / 32) * 7 + Math.floor(y / 24) * 11) % 9;
        box(x, y, 31, 23, k < 3 ? '#3a4a30' : k < 6 ? '#33452d' : '#2e402a');
        box(x + 2, y + 2, 25, 2, '#52623c');
        box(x + 3, y + 18, 27, 2, '#263523');
        if (k === 0) {
          box(x + 7, y + 8, 3, 2, '#81704a');
          box(x + 19, y + 13, 2, 2, '#63764a');
        }
        if (k === 4) {
          box(x + 11, y + 6, 2, 5, '#4d6137');
          box(x + 14, y + 4, 2, 5, '#637b43');
        }
        if (k === 7) {
          box(x + 5, y + 11, 7, 3, '#574c3b');
          box(x + 7, y + 9, 4, 2, '#7d6a4a');
        }
      }
    }
    for (let i = 0; i < 14; i++) {
      const x = (i * 67 + 31) % 790,
        y = 70 + ((i * 83) % 350);
      box(x, y, 12, 5, '#514b3c');
      box(x + 3, y - 3, 6, 3, '#75644a');
      box(x + 2, y + 5, 10, 2, '#2b3125');
    }
    box(0, 0, 800, 5, '#758456');
    box(0, 445, 800, 5, '#758456');
  }
  function drawMosquitoBg() {
    box(0, 0, 800, 450, '#18243b');
    for (let y = 0; y < 285; y += 35) {
      box(0, y, 800, 2, '#25334c');
      for (let x = y % 70 ? 20 : 55; x < 800; x += 112) box(x, y + 5, 2, 24, '#202d44');
    }
    box(0, 285, 800, 165, '#493b32');
    for (let y = 300; y < 450; y += 24) {
      box(0, y, 800, 2, '#6b5139');
      for (let x = y % 48 ? 0 : 38; x < 800; x += 76) box(x, y, 2, 24, '#5d4633');
    }
    box(475, 42, 245, 169, '#493f37');
    box(487, 54, 221, 145, '#8ba7bb');
    box(493, 60, 209, 133, '#23384d');
    for (let i = 0; i < 22; i++) {
      const x = (i * 47 + 18) % 205,
        y = (i * 31 + 7) % 120;
      box(493 + x, 60 + y, 3, 3, '#e6e5b8');
    }
    box(650, 72, 27, 27, '#e6dfac');
    box(658, 70, 27, 27, '#23384d');
    box(590, 54, 7, 145, '#9b805d');
    box(487, 122, 221, 7, '#9b805d');
    box(80, 218, 270, 93, '#715843');
    box(91, 203, 250, 48, '#d2c4a2');
    box(104, 210, 92, 34, '#e7ddc5');
    box(195, 211, 134, 34, '#70859b');
    box(82, 290, 273, 15, '#503e31');
    box(358, 260, 18, 51, '#815d3d');
    box(345, 250, 46, 13, '#b1915c');
    box(359, 230, 18, 18, '#f4d778');
    box(366, 223, 5, 9, '#fff1ad');
    box(0, 420, 800, 30, '#352f2b');
    for (let x = 10; x < 800; x += 35) box(x, 431, 20, 3, '#71604a');
  }
  function drawSportsDayBg() {
    box(0, 0, 800, 450, '#4c813c');
    for (let y = 0; y < 450; y += 24)
      for (let x = y % 48 ? 0 : 16; x < 800; x += 35)
        box(x, y, 18, 3, (x + y) % 2 ? '#619348' : '#3d7135');
    box(34, 44, 732, 362, '#a94f3c');
    box(47, 57, 706, 336, '#d1744a');
    box(59, 69, 682, 312, '#eee4be');
    box(67, 77, 666, 296, '#579047');
    box(76, 85, 648, 280, '#4d843e');
    for (let y = 97; y < 360; y += 38) {
      box(76, y, 648, 2, '#78a95b');
    }
    for (let x = 88; x < 730; x += 54) {
      box(x, 51, 25, 5, '#f3e1ad');
      box(x + 8, 56, 3, 9, '#f3e1ad');
    }
    for (let i = 0; i < 9; i++) {
      const x = 35 + i * 91;
      box(x, 20, 30, 13, ['#e8544f', '#f0d95d', '#3c9ce3', '#f7f0d6'][i % 4]);
      box(x + 12, 33, 3, 8, '#d9d0ad');
    }
    box(0, 414, 800, 36, '#385c32');
    for (let x = 0; x < 800; x += 22) box(x, 422, 12, 3, '#72984b');
  }
  function drawTimerBg() {
    box(0, 0, 800, 450, '#090d20');
    for (let i = 0; i < 70; i++) {
      const x = (i * 97 + 31) % 800,
        y = (i * 53 + 19) % 310;
      box(x, y, i % 7 === 0 ? 4 : 2, i % 7 === 0 ? 4 : 2, i % 3 ? '#8294c5' : '#d8d8b4');
    }
    box(622, 48, 54, 54, '#e5dfb4');
    box(632, 42, 48, 54, '#090d20');
    box(0, 325, 800, 125, '#151a30');
    box(0, 337, 800, 8, '#27304b');
    for (let x = 20; x < 800; x += 60) {
      box(x, 370, 26, 4, '#252e48');
      box(x + 12, 387, 34, 3, '#202943');
    }
    box(0, 425, 800, 25, '#0e1324');
    for (let x = 0; x < 800; x += 28) box(x, 434, 13, 3, '#30334b');
  }
  function drawHero(x: number, y: number, pose = 'idle', alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const p = 4,
      b = (dx: number, dy: number, w: number, h: number, c: string) =>
        box(x + dx * p, y + dy * p, w * p, h * p, c);
    const bob = pose === 'idle' ? Math.round(Math.sin(time * 5)) : 0;
    y += bob; // blue cloak, armor, helmet, boots
    b(-4, -4, 3, 8, '#284f8c');
    b(-5, -1, 2, 6, '#3972ba');
    b(-3, -7, 7, 8, '#3972ba');
    b(-2, -8, 5, 2, '#69a0dc');
    b(-2, 0, 3, 4, '#65747a');
    b(2, 0, 3, 4, '#78868a');
    b(-3, 4, 4, 2, '#765137');
    b(2, 4, 4, 2, '#765137');
    b(-3, 5, 4, 1, '#322922');
    b(2, 5, 4, 1, '#322922');
    b(-3, -8, 7, 2, '#93a1a0');
    b(-2, -10, 5, 3, '#c2cdc5');
    b(-1, -11, 3, 1, '#e4dfca');
    b(-1, -7, 4, 2, '#ddb68c');
    b(1, -6, 2, 1, '#262c29');
    b(4, -5, 1, 5, '#e0dfc9');
    b(5, -6, 1, 2, '#fff1bb');
    if (pose === 'hit') {
      b(-6, -7, 4, 2, '#b7423d');
      b(-8, -10, 2, 2, '#f06a54');
    }
    ctx.restore();
  }
  function drawDodgePlayer(x: number, y: number) {
    for (let row = -3; row <= 3; row++)
      for (let col = -3; col <= 3; col++)
        if (col * col + row * row <= 8)
          box(
            x + col * 4 - 2,
            y + row * 4 - 2,
            4,
            4,
            (row + col) % 3 === 0 ? '#ffe477' : '#c8f36a',
          );
    box(x - 3, y - 2, 2, 2, '#24311e');
    box(x + 2, y - 2, 2, 2, '#24311e');
    box(x - 2, y + 2, 4, 2, '#648348');
  }
  function drawDodgeOrb(x: number, y: number) {
    for (let row = -2; row <= 2; row++)
      for (let col = -2; col <= 2; col++)
        if (col * col + row * row <= 3)
          box(x + col * 3 - 1, y + row * 3 - 1, 3, 3, (row + col) % 2 ? '#e98259' : '#ffca75');
    box(x - 1, y - 1, 2, 2, '#fff0bd');
  }
  function drawGolem(x: number, y: number, state = 'idle') {
    const p = 5,
      b = (dx: number, dy: number, w: number, h: number, c: string) =>
        box(x + dx * p, y + dy * p, w * p, h * p, c);
    if (state === 'charge') x -= 3;
    if (state === 'windup') y += Math.round(Math.sin(time * 31) * 3);
    const armLift = state === 'windup' ? Math.max(0, Math.sin(time * 24)) * 3 : 0,
      glow = state === 'windup' && Math.sin(time * 28) > 0 ? '#ff6a45' : '#e83d36'; // Stomp and raise fists vertically; never sway sideways.
    b(-5, 2, 4, 5, '#4c514a');
    b(2, 2, 4, 5, '#454a45');
    b(-6, 6, 5, 2, '#383d38');
    b(1, 6, 6, 2, '#393d38');
    b(-8, -5, 5, 7, '#656a5c');
    b(5, -5, 5, 7, '#5e6258');
    b(-6, -10, 12, 13, '#77786a');
    b(-4, -12, 9, 4, '#858271');
    b(-3, -6, 8, 3, '#62655a');
    b(-4, -1, 9, 3, '#888271');
    b(-5, -10, 3, 3, '#9a917a');
    b(5, -8, 3, 2, '#aaa084');
    b(-3, -14, 9, 6, '#827d6b');
    b(-4, -16, 3, 3, '#65675d');
    b(1, -18, 3, 5, '#918875');
    b(5, -15, 3, 3, '#625e57');
    b(-2, -12, 2, 2, state === 'windup' ? glow : '#ed514a');
    b(3, -12, 2, 2, state === 'windup' ? glow : '#ed514a');
    b(0, -9, 2, 4, state === 'windup' ? '#ff4f48' : '#4b4140');
    b(-7, -4, 2, 3, '#867c6d');
    b(7, -3, 2, 2, '#948874');
    if (state === 'windup') {
      b(-10, -7 - armLift, 3, 3, '#77786a');
      b(8, -7 - armLift, 3, 3, '#77786a');
      b(-8, -4, 2, 6, '#a94740');
      b(6, -4, 2, 6, '#a94740');
      b(-5, -10, 10, 2, '#a94740');
      b(-3, -14, 3, 1, glow);
      b(2, -14, 3, 1, glow);
      b(-4, -6, 2, 1, glow);
      b(4, -4, 2, 1, glow);
      b(0, -4, 1, 3, glow);
    }
    if (state === 'charge') {
      b(-9, -7, 3, 2, '#9e413b');
      b(8, -8, 3, 2, '#a73d37');
    }
  }
  function drawGolemMap() {
    box(58, 193, 720, 77, '#4b4534');
    box(58, 193, 720, 5, '#86734b');
    box(58, 265, 720, 5, '#86734b');
    for (let x = 68; x < 770; x += 38) {
      box(x, 203, 28, 3, '#66563d');
      box(x + 10, 251, 20, 3, '#584a35');
    }
    for (let i = 0; i < 10; i++) {
      const x = 732 - i * (400 / 9),
        active = i === d.round - 1,
        passed = i < d.round - 1,
        c = active ? '#ffe477' : passed ? '#77bd68' : '#9a8862';
      box(x - 3, 196, 6, 73, c);
      box(x - 12, 185, 24, 11, c);
      box(x - 12, 263, 24, 11, c);
      box(x - 9, 188, 18, 3, active ? '#fff3aa' : '#d4c497');
      pixelText(`${limits.at(i)}ms`, x, 174, 9, c, 'center');
    }
    box(86, 226, 690, 4, '#b79a5e');
  }
  function drawGrassFX() {
    for (let i = 0; i < 24; i++) {
      const x = (i * 113 + Math.floor(time * 22)) % 800,
        y = (i * 71 + 43) % 430;
      box(x, y, 3, 6, '#78914c');
      box(x + 3, y + 2, 2, 4, '#4f7540');
    }
  }
  function drawMosquito(x: number, y: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(0.72, 0.72);
    ctx.translate(-x, -y);
    for (let i = 0; i < 32; i += 2) {
      const a = (i * Math.PI) / 16;
      box(x + Math.cos(a) * 30 - 2, y + Math.sin(a) * 30 - 2, 4, 4, '#f4d56c');
    }
    ctx.globalAlpha = 0.72;
    box(x - 20, y - 18, 17, 9, '#b3dce0');
    box(x - 17, y - 24, 12, 7, '#d1e9df');
    box(x + 3, y - 18, 17, 9, '#b3dce0');
    box(x + 5, y - 24, 12, 7, '#d1e9df');
    ctx.globalAlpha = 1;
    box(x - 5, y - 6, 10, 11, '#3e3029');
    box(x - 4, y + 4, 8, 19, '#49312a');
    box(x - 3, y + 8, 6, 3, '#a87945');
    box(x - 3, y + 14, 6, 2, '#a87945');
    box(x - 2, y + 20, 4, 7, '#332923');
    box(x - 5, y - 11, 10, 8, '#44332c');
    box(x - 4, y - 13, 3, 3, '#d85149');
    box(x + 1, y - 13, 3, 3, '#d85149');
    box(x - 1, y - 16, 2, 10, '#292622');
    box(x - 12, y - 2, 8, 2, '#312b27');
    box(x - 18, y + 1, 8, 2, '#312b27');
    box(x - 12, y + 7, 9, 2, '#312b27');
    box(x + 4, y - 2, 8, 2, '#312b27');
    box(x + 10, y + 1, 8, 2, '#312b27');
    box(x + 4, y + 7, 9, 2, '#312b27');
    box(x - 6, y - 3, 4, 2, '#9c7450');
    box(x + 3, y - 3, 4, 2, '#9c7450');
    box(x - 4, y + 26, 2, 6, '#312923');
    box(x + 3, y + 26, 2, 6, '#312923');
    ctx.restore();
  }
  function drawFlagAt(x: number, y: number, angle: number, color: string) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((angle * Math.PI) / 180);
    box(-5, -6, 10, 12, '#9a8354');
    box(-2, -62, 5, 60, '#d1c8a6');
    box(2, -58, 68, 39, '#10160f');
    box(0, -60, 65, 36, color);
    box(5, -56, 49, 4, '#ffffff48');
    box(57, -60, 8, 8, color);
    ctx.restore();
  }
  function drawRocketBg() {
    box(0, 0, 800, 450, '#101b35');
    for (let i = 0; i < 42; i++) {
      const x = (i * 173 + 31) % 800,
        y = (i * 97 + 17) % 205;
      box(x, y, 3, 3, i % 3 ? '#d8dfa6' : '#f5c85c');
    }
    box(0, 216, 800, 68, '#273653');
    for (let i = 0; i < 7; i++) {
      const x = i * 145 - 25;
      box(x, 220, 100, 42, '#354662');
      box(x + 22, 203, 54, 25, '#41516b');
      box(x + 36, 187, 27, 20, '#4c5b72');
    }
    box(0, 278, 800, 172, '#30363a');
    for (let y = 286; y < 450; y += 22) {
      box(0, y, 800, 2, '#42494b');
      for (let x = y % 44 ? 20 : 0; x < 800; x += 80) box(x, y + 2, 2, 20, '#42494b');
    }
    box(0, 338, 800, 6, '#d05c39');
    for (let x = 0; x < 800; x += 30) {
      box(x, 338, 14, 6, '#f1c153');
    }
    box(262, 256, 276, 116, '#222b35');
    box(270, 264, 260, 100, '#4a5151');
    box(284, 276, 232, 76, '#384344');
    box(300, 286, 200, 6, '#65715f');
    box(300, 342, 200, 6, '#65715f');
    box(185, 372, 430, 11, '#1a2228');
    for (let x = 205; x < 610; x += 40) {
      box(x, 372, 18, 11, x % 3 ? '#e9b94c' : '#ef6549');
    }
    for (let x = 280; x < 540; x += 52) {
      box(x, 248, 8, 56, '#788071');
      box(x - 5, 245, 18, 8, '#9da086');
    }
    box(54, 303, 86, 54, '#222c32');
    box(58, 308, 78, 43, '#496047');
    pixelText(t('launchPad'), 97, 329, 11, '#d8d4b2', 'center', 150);
  }
  function drawRocketLauncher() {
    box(355, 302, 90, 56, '#584638');
    box(368, 280, 65, 25, '#a0793e');
    box(384, 235, 32, 48, '#eee2b5');
    box(391, 211, 18, 25, '#f35d50');
    box(395, 195, 10, 17, '#ffd34e');
    for (let i = 0; i < 8; i++) box(320 + i * 24, 362, 11, 5, i % 2 ? '#566945' : '#78904b');
  }
  ctx.save();
  if (
    (stage === 0 && d.phase === 'result' && time - d.phaseAt < 0.15) ||
    (stage === 5 && d.rocketKind === 'fail' && time - d.rocketAt < 0.16)
  )
    ctx.translate(Math.random() * 8 - 4, Math.random() * 8 - 4);
  if (stage === 0) {
    drawBg();
    drawGrassFX();
  } else if (stage === 1) drawMosquitoBg();
  else if (stage === 2) box(0, 0, 800, 450, '#030407');
  else if (stage === 3) drawSportsDayBg();
  else if (stage === 4) drawTimerBg();
  else drawRocketBg();
  if (counting) {
    box(0, 0, 800, 450, '#10140fb8');
    pixelText(t('prepare'), 400, 168, 22, '#f2edda', 'center');
    pixelText(String(Math.max(1, Math.ceil(3 - d.readyAt))), 400, 238, 60, '#ffe477', 'center');
    ctx.restore();
    return;
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = '#d8dfc7';
  ctx.font = 'bold 20px sans-serif';
  if (stage === 0) {
    drawGolemMap();
    const budget = limits.at(d.round - 1) ?? 180,
      progress = d.phase === 'charge' ? Math.max(0, (d.elapsed - d.phaseAt) / (budget / 1000)) : 0,
      startX = 732 - (d.round - 1) * (400 / 9),
      x =
        d.phase === 'result' || d.phase === 'hit'
          ? d.golemResultX
          : clamp(startX - progress * (startX - 150), -8, 732),
      y = 230,
      heroY = d.used ? (d.round % 2 ? 130 : 330) : 230;
    if (d.phase === 'warning' || d.phase === 'charge') {
      box(72, y - 25, Math.max(0, x - 12), 42, '#ef40321e');
      for (let px = 70; px < x + 55; px += 18) {
        box(px, y - 25, 8, 5, '#ec5045');
        box(px + 8, y + 20, 7, 4, '#b6403d');
      }
      box(71, y - 38, 5, 50, '#ad3c39');
      box(127, y - 38, 5, 50, '#ad3c39');
      if (d.phase === 'warning') {
        const pulse = Math.sin(time * 38) > 0 ? '#ffef8a' : '#ff5149';
        box(x + 15, y - 70, 6, 28, pulse);
        box(x + 5, y - 57, 26, 6, '#ff5149');
        box(x - 12, y - 24, 42, 4, '#ff514966');
        ctx.globalAlpha = 0.08 + 0.12 * (0.5 + 0.5 * Math.sin(time * 28));
        box(x - 55, y - 92, 110, 136, '#f32f25');
        ctx.globalAlpha = 1;
      }
    }
    // 결과 화면으로 먼저 전환되어도 충돌 시각을 기준으로 피격 모션을 끝까지 재생합니다.
    const hit = d.phase === 'hit' || (d.phase === 'result' && d.impactAt >= 0),
      age = Math.max(0, d.elapsed - d.impactAt),
      hitProgress = Math.min(1, age / 0.5);
    drawHero(
      hit ? 92 - hitProgress * 38 : 92,
      hit ? 230 - (age < 0.38 ? Math.sin((age / 0.38) * Math.PI) * 62 : 0) : heroY,
      hit ? 'hit' : 'idle',
    );
    if (d.used && d.phase !== 'hit') {
      for (let i = 0; i < 16; i += 2) {
        const a = (i * Math.PI) / 8;
        box(92 + Math.cos(a) * 30 - 3, heroY + Math.sin(a) * 30 - 3, 6, 6, '#8ce5a9');
      }
      pixelText(t('safe'), 92, heroY - 43, 14, '#8ce5a9', 'center');
    }
    drawGolem(
      x,
      y,
      d.phase === 'warning' ? 'windup' : d.phase === 'charge' || d.phase === 'hit' ? 'charge' : 'idle',
    );
    if (d.phase !== 'hit' && d.flashAt >= 0 && time - d.flashAt < 0.2) {
      const age = time - d.flashAt;
      ctx.save();
      ctx.globalAlpha = (1 - age / 0.2) * 0.45;
      drawHero(92, heroY);
      ctx.restore();
      box(88, 226, 8, 8, '#fff1a1');
      box(75, 228, 34, 4, '#ffd34e');
      box(90, 213, 4, 34, '#ffd34e');
      if (age < 0.05) {
        box(0, 0, 800, 450, '#fff2a8b0');
        for (let i = 0; i < 22; i++)
          box(
            (i * 83 + Math.round(time * 800)) % 800,
            (i * 47 + Math.round(time * 300)) % 450,
            4,
            4,
            '#fff',
          );
      }
    }
    if (d.phase === 'result') {
      box(0, 0, 800, 450, '#11140f66');
      pixelText(formatMessage(t, d.message), 400, 180, 24, d.used ? '#8ce5a9' : '#f05a51', 'center', 740);
      pixelText(formatMessage(t, d.feedback), 400, 224, 15, '#f2edda', 'center', 740);
    }
  }
  if (stage === 1) {
    for (const dead of d.dead) {
      const age = time - dead.at;
      if (age >= 0.48) continue;
      ctx.save();
      ctx.globalAlpha = 1 - age / 0.48;
      ctx.translate(dead.x, dead.y + age * 60);
      ctx.rotate(Math.min(1, age * 5));
      box(-7, -4, 14, 7, '#49312a');
      box(-3, -8, 6, 6, '#44332c');
      box(-11, -10, 8, 5, '#b3dce0');
      box(4, -10, 8, 5, '#b3dce0');
      box(-2, 2, 4, 11, '#332923');
      for (let i = 0; i < 5; i++) box(-15 + i * 6, 6, 3, 3, i % 2 ? '#e75f56' : '#f4d56c');
      ctx.restore();
    }
    drawMosquito(d.target.x, d.target.y);
    if (d.pointerInside) {
      ctx.save();
      ctx.translate(d.pointerX, d.pointerY);
      const remaining = d.swingAt + swatterGeometry.swingDuration - time,
        swinging = remaining > 0,
        progress = swinging ? 1 - remaining / swatterGeometry.swingDuration : 0,
        amount = swinging ? swatAmount(progress) : 0;
      // 파리채 망의 중앙이 포인터에 고정됩니다.
      // 클릭하면 작아지면서 살짝 회전하고, 돌아올 때 다시 커지며 원래 각도로 복귀합니다.
      // (포인터 위치를 기준으로 변형하므로 조준점은 움직이지 않습니다.)
      ctx.rotate(((SWAT_ROTATION_DEG * Math.PI) / 180) * amount);
      const scale = SWAT_DRAW_SCALE * (1 - (1 - SWAT_SCALE_MIN) * amount);
      ctx.scale(scale, scale);
      ctx.translate(swatterGeometry.spriteAnchorShift.x, swatterGeometry.spriteAnchorShift.y);
      if (swinging && progress < 0.65) {
        ctx.globalAlpha = 0.3 * (1 - progress);
        box(-29, -37, 54, 3, '#fff2a8');
        box(-25, -33, 46, 2, '#ffe477');
        ctx.globalAlpha = 1;
      }
      box(-4, -2, 8, 38, '#815534');
      box(-2, 1, 4, 32, '#c08b53');
      box(-4, 33, 8, 3, '#d9c58d');
      box(-22, -29, 39, 34, '#a88a58');
      box(-18, -25, 31, 26, '#3c5845');
      for (let i = -14; i <= 10; i += 8) box(i, -24, 2, 24, '#d9c58d');
      for (let j = -20; j <= -4; j += 8) box(-18, j, 31, 2, '#d9c58d');
      box(-22, -31, 39, 4, '#d9c58d');
      box(-22, 3, 39, 4, '#d9c58d');
      ctx.restore();
    }
    pixelText(t('caught', { count: d.caught }), 30, 33, 16, '#f2edda');
    pixelText(t('caughtRate', { rate: (d.caught / Math.max(0.1, time)).toFixed(1) }), 190, 33, 14, '#8ce5a9');
    pixelText(t('seconds', { time: Math.max(0, 20 - time).toFixed(1) }), 770, 33, 16, '#ffe477', 'right');
  }
  if (stage === 2) {
    for (const o of d.orbs) drawDodgeOrb(o.x, o.y);
    drawDodgePlayer(d.x, d.y);
    pixelText(t('seconds', { time: Math.max(0, 40 - time).toFixed(1) }), 30, 32, 17, '#ffe477');
    pixelText(t('bulletsDodged', { count: d.dodged }), 770, 32, 15, '#f2edda', 'right');
  }
  if (stage === 3) {
    box(160, 135, 195, 155, '#243526');
    box(445, 135, 195, 155, '#243526');
    box(175, 290, 165, 9, '#82734d');
    box(460, 290, 165, 9, '#82734d');
    drawFlagAt(220, 247, d.blueAngle, '#3e9bff');
    drawFlagAt(505, 247, d.whiteAngle, '#f4eed6');
    pixelText(t('blue'), 257, 322, 19, '#f2edda', 'center');
    pixelText(t('white'), 542, 322, 19, '#f2edda', 'center');
    const prompt = flagPrompt(d.flag, locale, t);
    const shown = visibleFlagCharacters(d.flag, d.elapsed - d.phaseAt, prompt.length);
    ctx.save();
    ctx.font = '700 28px "Noto Sans KR", sans-serif';
    const promptSize = Math.min(28, (28 * 740) / Math.max(1, ctx.measureText(prompt).width));
    ctx.restore();
    pixelText(prompt.slice(0, shown), 400, 89, promptSize, '#ffe477', 'center', 740);
    if (d.answerAt)
      pixelText(
        formatMessage(t, d.message),
        400,
        365,
        18,
        d.message && d.message.key === 'flagCorrect' ? '#8ce5a9' : '#f05a51',
        'center',
      );
  }
  if (stage === 4) {
    const elapsed = d.active ? Math.max(0, d.elapsed - d.timerStart) : (d.measurements.at(-1) ?? 0);
    const x = 60,
      y = 318,
      w = 680,
      h = 24,
      ix = x + 4,
      iy = y + 4,
      iw = w - 8,
      ih = h - 8,
      at = (t: number) => ix + (iw * t) / 12;
    box(x, y, w, h, '#101610');
    box(ix, iy, iw, ih, '#334031');
    const bands: [number, number, string][] = [
      [0, 8, '#a64b45'],
      [8, 8.5, '#c87549'],
      [8.5, 9, '#d39d4a'],
      [9, 9.5, '#ddc34c'],
      [9.5, 9.8, '#9fc957'],
      [9.8, 10.2, '#72bd64'],
      [10.2, 10.5, '#9fc957'],
      [10.5, 11, '#ddc34c'],
      [11, 11.5, '#d39d4a'],
      [11.5, 12, '#c87549'],
    ];
    for (const [start, end, color] of bands)
      box(at(start), iy, ((end - start) * iw) / 12, ih, color);
    box(at(10) - 2, y - 2, 4, h + 4, '#ffe477');
    const alpha = d.active
      ? elapsed <= 3
        ? 1
        : clamp(1 - (elapsed - 3) / 1.2, 0, 1)
      : d.measurements.length
        ? 1
        : 0;
    if (alpha > 0) {
      ctx.save();
      ctx.globalAlpha = alpha;
      const px = at(clamp(elapsed, 0, 12));
      box(ix, iy, Math.max(2, px - ix), ih, '#fff4c766');
      box(px - 2, y - 3, 4, h + 6, '#fff4c6');
      ctx.restore();
    }
  }
  if (stage === 5) {
    drawRocketLauncher();
    if (d.launchAt >= 0 && time - d.launchAt < 0.8) {
      const t = clamp((time - d.launchAt) / 0.8, 0, 1),
        ry = 278 - t * 178;
      box(392, ry, 16, 28, '#f1e6c6');
      box(396, ry - 9, 8, 11, '#e65a49');
      box(399, ry - 18, 2, 11, '#ffd34e');
      box(388, ry + 24, 5, 10, '#ffaf45');
      box(407, ry + 24, 5, 10, '#ffdf66');
    }
    const remaining = Math.max(0, 30 - d.elapsed),
      ratio = clamp(remaining / 30, 0, 1);
    pixelText(t('launchCount', { count: d.rockets }), 34, 30, 16, '#ffd34e');
    box(125, 19, 550, 20, '#101610');
    box(129, 23, 542, 12, '#293327');
    box(129, 23, Math.round(542 * ratio), 12, ratio < 0.25 ? '#ef6555' : '#c8f36a');
    pixelText(t('seconds', { time: remaining.toFixed(1) }), 766, 30, 14, '#f2edda', 'right');
    const gap = Math.min(66, 680 / d.length),
      left = 400 - (gap * (d.length - 1)) / 2;
    d.sequence.forEach((direction, i) => {
      const x = left + i * gap,
        active = i === d.step,
        recent = i === d.keyIndex && time - d.keyAt < 0.32,
        edge =
          direction === 'up'
            ? '#65d4ff'
            : direction === 'down'
              ? '#ffba55'
              : direction === 'left'
                ? '#c29aff'
                : '#8ce5a9',
        fill =
          direction === 'up'
            ? '#164864'
            : direction === 'down'
              ? '#704319'
              : direction === 'left'
                ? '#4d3674'
                : '#22583b';
      box(x - 23, 76, 46, 48, recent ? '#8ce5a9' : edge);
      box(x - 20, 79, 40, 42, recent ? '#41654a' : active ? edge : fill);
      pixelText(
        glyph(direction),
        x,
        100,
        27,
        recent || active ? '#fff0bd' : i < d.step ? '#8ce5a9' : '#ffffff',
        'center',
      );
      if (recent) pixelText('✓', x, 62, 12, '#8ce5a9', 'center');
    });
    pixelText(t('rocketLength', { count: d.length }), 400, 160, 13, '#f2edda', 'center');
    if (
      (d.rocketKind === 'success' || d.rocketKind === 'fail') &&
      d.rocketAt >= 0 &&
      time - d.rocketAt < 0.55
    ) {
      const success = d.rocketKind === 'success',
        age = time - d.rocketAt;
      box(215, 185, 370, 65, success ? '#8ce5a933' : '#f05a5133');
      box(215, 185, 370, 4, success ? '#8ce5a9' : '#ff766a');
      pixelText(
        success ? t('rocketLaunched') : t('rocketRetry'),
        400,
        218,
        success ? 21 : 18,
        success ? '#8ce5a9' : '#f05a51',
        'center',
      );
      if (!success && age < 0.18) box(0, 0, 800, 450, '#e9473830');
      if (success && age < 0.12) box(0, 0, 800, 450, '#c8f36a26');
    }
  }
  for (const p of d.particles) {
    ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
    box(p.x, p.y, p.size, p.size, p.color);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawRadar(ctx: CanvasRenderingContext2D, scores: (number | null)[], t: Translate) {
  const width = 600;
  const height = 410;
  const centerX = 300;
  const centerY = 213;
  const radius = 126;
  const angle = (index: number) => -Math.PI / 2 + (index * Math.PI) / 3;

  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = '#667557';
  ctx.lineWidth = 2;

  for (let ring = 1; ring <= 4; ring++) {
    ctx.beginPath();
    skillNames.forEach((_, index) => {
      const x = centerX + Math.cos(angle(index)) * radius * (ring / 4);
      const y = centerY + Math.sin(angle(index)) * radius * (ring / 4);
      if (index) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  }

  skillNames.forEach((_, index) => {
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(angle(index)) * radius,
      centerY + Math.sin(angle(index)) * radius,
    );
    ctx.stroke();
  });

  ctx.beginPath();
  skillNames.forEach((_, index) => {
    const value = (scores.at(index) ?? 0) / 100;
    const x = centerX + Math.cos(angle(index)) * radius * value;
    const y = centerY + Math.sin(angle(index)) * radius * value;
    if (index) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = '#c8f36a55';
  ctx.fill();
  ctx.strokeStyle = '#d4ff72';
  ctx.lineWidth = 4;
  ctx.stroke();

  skillNames.forEach((skill, index) => {
    const value = scores.at(index) ?? 0;
    const x = centerX + (Math.cos(angle(index)) * radius * value) / 100;
    const y = centerY + (Math.sin(angle(index)) * radius * value) / 100;
    ctx.fillStyle = '#f5dc70';
    ctx.fillRect(x - 4, y - 4, 8, 8);
    ctx.font = 'bold 18px "Noto Sans KR",sans-serif';
    ctx.fillStyle = '#f1edd5';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `${t(skill)} ${value}`,
      centerX + Math.cos(angle(index)) * (radius + 45),
      centerY + Math.sin(angle(index)) * (radius + 37),
      220,
    );
  });
}
