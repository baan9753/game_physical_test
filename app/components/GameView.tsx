'use client';

import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import HomePage from './game-pages/HomePage';
import StageIntroPage from './game-pages/StageIntroPage';
import GameplayPage from './game-pages/GameplayPage';
import StageCompletePage from './game-pages/StageCompletePage';
import OverallResultsPage from './game-pages/OverallResultsPage';
import type { GameViewModel } from './game-pages/types';

/**
 * 게임의 공통 프레임과 모드별 페이지 전환을 담당하는 최상위 View입니다.
 * 실제 화면 내용은 game-pages 아래의 페이지 컴포넌트가 렌더링합니다.
 */
export default function GameView(model: GameViewModel) {
  const { state, root, onKeyDown, onKeyUp, onBlur, onTogglePause } = model;
  // 설정 창 표시 여부
  const [settingsOpen, setSettingsOpen] = useState(false);
  // 설정을 열기 전에 진행 중이었다면, 닫을 때 게임을 다시 재개해야 하므로 그 여부를 기억합니다.
  const resumeAfterSettings = useRef(false);

  // 게임 중 설정을 열면 먼저 진행을 멈추고, 닫을 때 이어서 진행합니다.
  const openSettings = () => {
    if (settingsOpen) return;
    resumeAfterSettings.current = state.mode === 'play' || state.mode === 'countdown';
    if (resumeAfterSettings.current) onTogglePause();
    setSettingsOpen(true);
  };
  const closeSettings = () => {
    setSettingsOpen(false);
    if (resumeAfterSettings.current) {
      resumeAfterSettings.current = false;
      onTogglePause();
    }
  };
  // 설정에서 "처음 화면"을 누른 경우: 재개하지 않고 홈으로 이동
  const returnHomeFromSettings = () => {
    resumeAfterSettings.current = false;
    setSettingsOpen(false);
    model.onGoHome();
  };
  // 연습 모드에서 "현재 단계 다시 시작"을 누른 경우: 재개하지 않고 해당 단계를 처음부터 시작
  const restartPracticeStage = () => {
    resumeAfterSettings.current = false;
    setSettingsOpen(false);
    model.onBeginStage();
  };
  // Esc는 설정 창 열기/닫기로 처리하고, 그 외 키는 게임 입력 핸들러로 넘깁니다.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.code === 'Escape' && !event.repeat) {
      event.preventDefault();
      if (settingsOpen) closeSettings();
      else openSettings();
      return;
    }
    onKeyDown(event);
  };

  // 창 높이에 콘텐츠가 넘칠 때 모든 화면 요소를 같은 비율로 축소해 스크롤을 막습니다.
  // CSS 변수 --gp-fit-scale(0~1)을 계산해 .gp-screen에 설정하면, CSS의 zoom이 이를 적용합니다.
  useEffect(() => {
    const screen = root.current?.querySelector<HTMLElement>('.gp-screen');
    if (!screen) return;

    let frame = 0;
    const fitContent = () => {
      cancelAnimationFrame(frame);
      // 먼저 배율을 1로 되돌려 "원래 크기"의 콘텐츠 높이를 측정할 수 있게 합니다.
      screen.style.setProperty('--gp-fit-scale', '1');
      frame = requestAnimationFrame(() => {
        const availableHeight = screen.clientHeight;
        const contentHeight = screen.scrollHeight;
        // 콘텐츠가 더 크면 (사용 가능 높이 / 콘텐츠 높이)만큼 축소, 아니면 1 유지
        const scale = Math.min(1, availableHeight / Math.max(availableHeight, contentHeight));
        screen.style.setProperty('--gp-fit-scale', String(scale));
      });
    };

    // 화면 크기가 바뀌거나 단계/모드가 바뀔 때마다 다시 계산합니다.
    const observer = new ResizeObserver(fitContent);
    observer.observe(screen);
    window.addEventListener('resize', fitContent);
    fitContent();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', fitContent);
    };
  }, [root, state.mode, state.stage, state.stageRun]);

  // 현재 게임 상태에 맞는 페이지 컴포넌트를 선택합니다.
  const page = (() => {
    switch (state.mode) {
      case 'home':
        return <HomePage model={model} />;
      case 'intro':
        return <StageIntroPage model={model} />;
      // 카운트다운/플레이/일시정지는 같은 플레이 화면을 공유합니다.
      case 'countdown':
      case 'play':
      case 'pause':
        return model.d ? <GameplayPage model={model} /> : null;
      case 'complete':
        return model.d ? <StageCompletePage model={model} /> : null;
      case 'results':
        return <OverallResultsPage model={model} />;
      default:
        return null;
    }
  })();

  return (
    // 키보드 이벤트를 받기 위해 tabIndex를 주고, 모든 키 입력을 이 최상위 요소에서 처리합니다.
    <div
      className="gp-app"
      ref={root}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onBlur={onBlur}
      onKeyUp={onKeyUp}
    >
      {/* 레트로 게임기 느낌의 바깥 프레임 */}
      <div className="gp-frame">
        <div className="gp-screen">
          {/* 모든 화면 우측 상단에 고정된 설정 버튼 */}
          <button
            className="gp-btn gp-screen-settings"
            aria-label="설정 열기"
            title="설정"
            onClick={openSettings}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.6 3h4.8l.6 2.3a7.3 7.3 0 0 1 1.8 1l2.2-.8 2.4 4.2-1.8 1.7v1.2l1.8 1.7-2.4 4.2-2.2-.8a7.3 7.3 0 0 1-1.8 1l-.6 2.3H9.6L9 18.7a7.3 7.3 0 0 1-1.8-1L5 18.5l-2.4-4.2 1.8-1.7v-1.2L2.6 9.7 5 5.5l2.2.8a7.3 7.3 0 0 1 1.8-1L9.6 3Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          {page}
          {/* 설정 창: 화면 위에 덮이는 모달. 바깥 영역을 누르면 닫힙니다. */}
          {settingsOpen && (
            <section
              className="gp-overlay gp-settings-overlay"
              role="presentation"
              onMouseDown={(event) => {
                // 카드 내부가 아니라 배경(오버레이) 자체를 눌렀을 때만 닫습니다.
                if (event.target === event.currentTarget) closeSettings();
              }}
            >
              <div
                className="gp-card gp-settings-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="settings-title"
              >
                <div className="gp-settings-heading">
                  {/* <span className="gp-tag">게임 설정</span> */}
                  <button
                    className="gp-btn gp-settings-close"
                    aria-label="설정 닫기"
                    onClick={closeSettings}
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" shapeRendering="crispEdges">
                      <path d="m6 6 12 12M18 6 6 18" />
                    </svg>
                  </button>
                </div>
                <h2 id="settings-title">설정</h2>
                {/* 사운드 토글: aria-pressed로 켜짐/꺼짐 상태를 보조기기에 전달합니다. */}
                <div className="gp-settings-options">
                  <button
                    className="gp-settings-toggle"
                    aria-pressed={model.musicEnabled}
                    onClick={model.onToggleMusic}
                  >
                    <span>브금</span>
                    <b>{model.musicEnabled ? '켜짐' : '꺼짐'}</b>
                  </button>
                  <button
                    className="gp-settings-toggle"
                    aria-pressed={model.sfxEnabled}
                    onClick={model.onToggleSfx}
                  >
                    <span>효과음</span>
                    <b>{model.sfxEnabled ? '켜짐' : '꺼짐'}</b>
                  </button>
                </div>
                <div className="gp-actions gp-settings-actions">
                  {state.practice ? (
                    <>
                      <button className="gp-btn" onClick={restartPracticeStage}>
                        다시 연습
                      </button>
                      <button className="gp-btn gp-primary" onClick={returnHomeFromSettings}>
                        연습 끝내기
                      </button>
                    </>
                  ) : (
                    state.mode !== 'home' && (
                      <button className="gp-btn" onClick={returnHomeFromSettings}>
                        처음 화면
                      </button>
                    )
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
