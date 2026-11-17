'use client';

import { controlDirs, glyph, names } from '../../../lib/game-data';
import type { GameplayPageModel } from './types';

/** 플레이 화면: 공통 HUD, Canvas, 일시정지, 단계별 조작 버튼을 묶습니다. */
export default function GameplayPage({ model }: { model: GameplayPageModel }) {
  const {
    state,
    d,
    hudText,
    root,
    canvas,
    onAction,
    onMove,
    onStop,
    onMosquitoMove,
    onMosquitoLeave,
    onMosquitoHit,
  } = model;

  // 단계 데이터가 준비되기 전에는 렌더링하지 않습니다.
  if (!d) return null;
  const isTimerCountdown = state.stage === 4 && state.mode === 'countdown';

  return (
    <>
      {/* 모든 단계에서 공통으로 쓰는 점수 HUD */}
      <div className="gp-topbar">
        <div className="gp-hud">
          <b>{names.at(state.stage)}</b>
          <span>점수 {d.score}점</span>
          <span>{hudText.at(0)}</span>
        </div>
      </div>
      {/* 청기백기 단계에서만 표시하는 30초 제한시간. 남은 시간에 따라 초록 → 노랑(15초 이후) → 빨강(24초 이후)으로 바뀝니다. */}
      {state.stage === 3 && (
        <div className="gp-flag-timer">
          <span>남은 시간</span>
          <div className="gp-flag-time-track">
            <i
              className="gp-flag-time-fill"
              style={{
                width: `${Math.max(0, 1 - d.elapsed / 30) * 100}%`,
                background: d.elapsed > 24 ? '#f05a51' : d.elapsed > 15 ? '#ffd35b' : '#8ce5a9',
              }}
            />
          </div>
          <b>{Math.max(0, 30 - d.elapsed).toFixed(1)}초</b>
        </div>
      )}
      {/* 픽셀 게임 장면은 Canvas에 그리고, 포인터 입력만 ViewModel로 전달합니다.
          캔버스 내부 해상도는 800x450 고정이라, 화면 크기에 맞게 늘어난 좌표를 800x450 기준으로 환산해 전달합니다. */}
      <div className="gp-arena">
        {state.stage === 4 && !isTimerCountdown && (
          <div className="gp-timer-ui" aria-live="polite">
            <strong>
              {d.active
                ? d.elapsed - d.timerStart < 3
                  ? '처음 3초는 시간 흐름을 확인하세요'
                  : '10초가 되면 눌러주세요'
                : '측정 결과'}
            </strong>
            {d.active && d.elapsed - d.timerStart < 3 && (
              <span>{Math.max(0, d.elapsed - d.timerStart).toFixed(1)}초</span>
            )}
            <div className="gp-timer-scale" aria-hidden="true">
              <span>0초</span>
              <b>10초</b>
              <span>12초</span>
            </div>
            {!d.active && d.message && <p className="gp-timer-result">{d.message}</p>}
          </div>
        )}
        <canvas
          ref={canvas}
          width={800}
          height={450}
          // 2단계(모기 잡기)에서는 직접 그린 조준 표시를 쓰므로 기본 커서를 숨깁니다.
          style={{ cursor: state.stage === 1 ? 'none' : 'default' }}
          aria-label={`${names.at(state.stage)} 게임 화면`}
          onPointerMove={(e) => {
            if (state.stage !== 1) return;
            const rect = e.currentTarget.getBoundingClientRect();
            onMosquitoMove(
              ((e.clientX - rect.left) * 800) / rect.width,
              ((e.clientY - rect.top) * 450) / rect.height,
            );
          }}
          onPointerLeave={() => state.stage === 1 && onMosquitoLeave()}
          onPointerDown={(e) => {
            // 캔버스를 눌러도 키보드 입력이 계속 동작하도록 루트로 포커스를 돌려줍니다.
            root.current?.focus();
            if (state.stage !== 1) return;
            const rect = e.currentTarget.getBoundingClientRect();
            onMosquitoHit(
              ((e.clientX - rect.left) * 800) / rect.width,
              ((e.clientY - rect.top) * 450) / rect.height,
            );
          }}
        />
      </div>
      {/* 현재 상황 안내 문구 (좌/우 두 줄) */}
      {!isTimerCountdown && (
        <div className="gp-instruction">
          <span>{hudText.at(1)}</span>
          <span>{hudText.at(2)}</span>
        </div>
      )}
      {/* 단계별 키보드 대체 조작 버튼 (모바일/터치 환경용) */}
      {!isTimerCountdown && <div className="gp-mobile-controls">
        {/* 1단계: 골렘 돌진을 점멸로 회피 */}
        {state.stage === 0 && (
          <button
            className="gp-btn gp-primary"
            onPointerDown={(event) => {
              event.preventDefault();
              onAction();
            }}
          >
            회피하기 (D · F 키)
          </button>
        )}
        {/* 2단계: 별도 버튼 없이 캔버스를 직접 조작 */}
        {state.stage === 1 && <span>클릭 또는 터치로 모기를 잡으세요</span>}
        {/* 3단계: 방향 버튼을 누르는 동안 플레이어 이동. 포인터 캡처로 손가락이 버튼 밖으로 나가도 떼는 이벤트를 받습니다. */}
        {state.stage === 2 &&
          controlDirs.map((dir) => (
            <button
              key={dir}
              className="gp-btn"
              onPointerDown={(e) => {
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                onMove(dir);
              }}
              onPointerUp={() => onStop(dir)}
              onPointerCancel={() => onStop(dir)}
              onLostPointerCapture={() => onStop(dir)}
            >
              {glyph(dir)}
              <small>
                {dir === 'up' ? 'W' : dir === 'left' ? 'A' : dir === 'down' ? 'S' : 'D'}
              </small>
            </button>
          ))}
        {/* 4단계: 청기백기 명령 4개. 인덱스 0~3이 각각 W/S/O/K 키와 대응됩니다. */}
        {state.stage === 3 &&
          ['청기 올리기', '청기 내리기', '백기 올리기', '백기 내리기'].map((label, i) => (
            <button key={label} className="gp-btn" onClick={() => onAction(i)}>
              {label}
              <br />
              <small>{['W', 'S', 'O', 'K'].at(i)}</small>
            </button>
          ))}
        {/* 5단계: 10초 측정 시작 또는 정지. 버튼 문구는 진행 상태에 따라 바뀝니다. */}
        {state.stage === 4 && (
          <button className="gp-btn gp-primary" onClick={() => onAction()}>
            {d.active
              ? '정지 (SPACE 키)'
              : d.trial >= 3
                ? '결과 보기'
                : d.trial > 0
                  ? '다음 측정'
                  : '측정 시작'}
          </button>
        )}
        {/* 6단계: 방향키 순서를 터치로 입력 */}
        {state.stage === 5 &&
          controlDirs.map((dir) => (
            <button
              key={dir}
              className={`gp-btn gp-rocket-${dir}`}
              onClick={() => onAction(undefined, dir)}
            >
              {glyph(dir)}
            </button>
          ))}
      </div>}
    </>
  );
}
