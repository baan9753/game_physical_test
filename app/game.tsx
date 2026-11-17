'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';
import { trackGameEvent } from '../lib/game-events';
import { dirs, flags, initial, names, scoreProfile } from '../lib/game-data';
import { clamp, hud, inputSounds, reducer } from '../lib/game-engine';
import { drawRadar, paint } from '../lib/game-renderer';
import { createGameSound } from '../lib/game-sound';
import type { GameSoundEffect } from '../lib/game-sound';
import type { Action, Direction, Mode, State } from '../lib/game-types';
import GameView from './components/GameView';

/**
 * 게임 전체의 ViewModel(컨트롤러) 컴포넌트입니다.
 *
 * 역할
 * - reducer로 게임 상태(State)를 관리하고, requestAnimationFrame 루프로 매 프레임 'tick'을 보냅니다.
 * - Canvas 렌더링, 효과음 재생, 분석 이벤트 전송 같은 "부수 효과"를 담당합니다.
 * - 키보드/포인터 입력을 Action으로 변환해 reducer에 전달합니다.
 * - 화면 표시는 GameView에 위임하고, 필요한 데이터와 콜백만 props로 넘깁니다.
 */
export default function Game() {
  // 게임의 모든 진행 상태. 모드(home/intro/play 등), 단계, 점수, 단계별 데이터가 들어 있습니다.
  const [state, dispatch] = useReducer(reducer, initial);
  // 설정 화면에서 토글하는 배경음악/효과음 켜짐 여부
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);

  // ----- ref 모음: 렌더링과 무관하게 값을 유지해야 하는 것들 -----
  const root = useRef<HTMLDivElement>(null), // 키보드 입력을 받는 최상위 div (포커스 제어용)
    canvas = useRef<HTMLCanvasElement>(null), // 미니게임 장면을 그리는 캔버스
    radar = useRef<HTMLCanvasElement>(null), // 결과 화면의 육각형 능력 차트 캔버스
    last = useRef(0), // 직전 프레임의 performance.now() 값 (dt 계산용)
    finished = useRef(''), // 단계 완료 이벤트를 중복 전송하지 않기 위한 키 ("run:stageRun")
    shown = useRef(0), // 전체 테스트 완료 이벤트를 중복 전송하지 않기 위한 run 번호
    soundRef = useRef<ReturnType<typeof createGameSound> | null>(null), // 사운드 엔진 인스턴스(지연 생성)
    previousAudioFrame = useRef<State | null>(null), // 직전 상태 스냅샷: 상태 변화를 비교해 효과음을 결정
    // 입력 즉시 재생한 '충돌' 효과음이 상태 변화 감지 로직에서 또 재생되지 않도록 표시해 두는 마커
    inputSoundMark = useRef({ run: -1, stageRun: -1, failures: 0 });
  // 이전 화면 모드. 홈 화면 진입 시 한 번만 페이지뷰 이벤트를 보내기 위해 사용합니다.
  const previousScreen = useRef<Mode | null>(null);

  // 홈 화면으로 "새로 진입"했을 때만 main_page_view 이벤트를 전송합니다.
  useEffect(() => {
    if (state.mode === 'home' && previousScreen.current !== 'home')
      trackGameEvent('main_page_view');
    previousScreen.current = state.mode;
  }, [state.mode]);

  // 사운드 엔진을 처음 필요할 때 생성합니다. 브라우저 오디오 정책상 사용자 입력 이후에 만드는 것이 안전합니다.
  const getSound = useCallback(() => {
    if (!soundRef.current) soundRef.current = createGameSound();
    return soundRef.current;
  }, []);

  // 메인 게임 루프: 매 프레임 경과 시간(dt)과 난수를 담은 'tick' 액션을 보냅니다.
  // 난수를 reducer 밖(여기)에서 만들어 전달하므로 reducer는 순수 함수로 유지됩니다.
  useEffect(() => {
    let frame = 0;
    const loop = () => {
      const now = performance.now(),
        dt = last.current ? Math.max(0, (now - last.current) / 1000) : 0;
      last.current = now;
      dispatch({
        type: 'tick',
        dt,
        random: Math.random(),
        randoms: Array.from({ length: 256 }, () => Math.random()),
      });
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  // 카운트다운이 시작되면(단계가 바뀔 때마다) 루트 요소로 포커스를 옮겨 키 입력을 바로 받게 합니다.
  useEffect(() => {
    if (state.mode === 'countdown') root.current?.focus();
  }, [state.mode, state.stageRun]);

  // 플레이/카운트다운 중에는 상태가 바뀔 때마다 캔버스에 장면을 다시 그립니다.
  useEffect(() => {
    if (state.mode === 'play' || state.mode === 'countdown') {
      const c = canvas.current;
      const ctx = c?.getContext('2d');
      if (ctx && state.gameData) {
        ctx.imageSmoothingEnabled = false; // 픽셀 아트가 흐려지지 않도록 보간 끄기
        paint(ctx, state.stage, state.gameData, state.mode === 'countdown');
      }
    }
  }, [state]);

  // 단계 완료 시 stage_complete 이벤트 전송. run/stageRun 조합 키로 같은 단계의 중복 전송을 막습니다.
  useEffect(() => {
    if (state.mode !== 'complete' || !state.gameData) return;
    const k = `${state.run}:${state.stageRun}`;
    if (finished.current === k) return;
    finished.current = k;
    trackGameEvent('stage_complete', {
      stage: Number(state.stage + 1),
      score: Number(state.gameData.score),
      practice: Number(state.practice),
    });
  }, [state.mode, state.stage, state.stageRun, state.run, state.practice, state.gameData]);

  // 종합 결과 화면에 들어오면 full_test_complete 이벤트(총점/평균)를 run당 한 번만 전송합니다.
  useEffect(() => {
    if (state.mode !== 'results' || shown.current === state.run) return;
    shown.current = state.run;
    const total = state.scores.reduce<number>((sum, value) => sum + (value ?? 0), 0);
    trackGameEvent('full_test_complete', {
      total: Number(total),
      average: Number(Math.round(total / 6)),
    });
  }, [state.mode, state.run, state.scores]);

  // 컴포넌트가 사라질 때 사운드 엔진을 정리합니다.
  useEffect(
    () => () => {
      soundRef.current?.dispose();
      soundRef.current = null;
    },
    [],
  );

  // 효과음 재생 로직: "이전 프레임"과 "현재 프레임"의 상태를 비교해 변화가 생긴 순간에 맞는 소리를 냅니다.
  useEffect(() => {
    const prev = previousAudioFrame.current;
    previousAudioFrame.current = state;
    const a = soundRef.current;
    // 사운드가 없거나, 이전 프레임이 없거나, 다른 단계 시도로 넘어간 경우에는 비교하지 않습니다.
    if (!a || !prev || prev.stageRun !== state.stageRun || !prev.gameData || !state.gameData)
      return;
    const old = prev.gameData,
      d = state.gameData,
      play = (kind: GameSoundEffect) => a.playSfx(kind);

    // 카운트다운 숫자가 바뀔 때마다 '카운트' 소리
    if (
      state.mode === 'countdown' &&
      prev.mode === 'countdown' &&
      Math.ceil(3 - old.readyAt) !== Math.ceil(3 - d.readyAt)
    )
      play('count');
    // 카운트다운 종료 → 플레이 시작 소리 (5단계는 타이머가 이미 돌고 있으면 추가 소리)
    if (prev.mode === 'countdown' && state.mode === 'play') {
      play('start');
      if (state.stage === 4 && d.active) play('timer');
    }
    // 1단계(골렘 회피): 경고/돌진 단계 전환, 회피 성공, 피격 소리
    if (state.stage === 0) {
      if (old.phase !== d.phase && d.phase === 'warning') play('warning');
      if (old.phase !== d.phase && d.phase === 'charge') play('charge');
      if (d.success > old.success && d.phase !== 'hit') play('dodge');
      // 입력 순간에 이미 충돌음을 낸 경우(inputSoundMark)에는 중복 재생하지 않습니다.
      const hitStarted = old.phase !== 'hit' && d.phase === 'hit';
      if (hitStarted) {
        const hitFailureCount = old.failures + 1;
        if (
          inputSoundMark.current.run !== state.run ||
          inputSoundMark.current.stageRun !== state.stageRun ||
          inputSoundMark.current.failures < hitFailureCount
        ) play('impact');
        inputSoundMark.current = {
          run: state.run,
          stageRun: state.stageRun,
          failures: hitFailureCount,
        };
      }
    }
    // 3단계(로켓 회피): 아슬아슬하게 피했을 때, 40초 이전에 충돌로 끝났을 때
    if (state.stage === 2) {
      if (d.nearMisses > old.nearMisses) play('nearMiss');
      if (prev.mode === 'play' && state.mode === 'complete' && d.elapsed < 40) play('impact');
    }
    // 4단계(청기백기): 제시문이 한 글자씩 타이핑될 때마다 타자 소리
    if (state.stage === 3) {
      const elapsed = Math.max(0, d.elapsed - d.phaseAt),
        before = Math.max(0, old.elapsed - old.phaseAt);
      if (
        state.mode === 'play' &&
        d.flag === old.flag &&
        Math.min(flags.at(d.flag)?.text.length ?? 0, Math.floor(elapsed * 24) + 1) >
          Math.min(flags.at(old.flag)?.text.length ?? 0, Math.floor(before * 24) + 1)
      )
        play('type');
    }
    // 5단계(10초 맞추기): 측정 중 1~3초 구간에서 초가 바뀔 때마다 틱 소리
    if (state.stage === 4) {
      if (old.active && d.active) {
        const oldSecond = Math.floor(old.elapsed - old.timerStart),
          second = Math.floor(d.elapsed - d.timerStart);
        if (second > oldSecond && second <= 3) play('timerTick');
      }
    }
    // 플레이 → 완료로 넘어가는 순간 공통 완료 소리
    if (prev.mode === 'play' && state.mode === 'complete') play('complete');
  }, [state]);

  // 종합 결과 화면이 열리면 육각형 레이더 차트를 그립니다.
  useEffect(() => {
    if (state.mode !== 'results') return;
    const context = radar.current?.getContext('2d');
    if (context) drawRadar(context, state.scores);
  }, [state.mode, state.scores]);

  // 홈 화면에서 연습/전체 테스트 시작. 사용자 입력 시점에 오디오를 활성화합니다.
  const start = (stage: number, practice: boolean) => {
    getSound().resumeAudio();
    if (practice) trackGameEvent('practice_start', { stage: Number(stage + 1) });
    else trackGameEvent('full_test_start');
    dispatch({ type: 'begin', stage, practice });
  };

  // 단계 안내 화면의 "시작하기" 버튼: 카운트다운을 시작하고 시작 이벤트를 기록합니다.
  const beginStage = useCallback(() => {
    getSound().resumeAudio();
    getSound().playSfx('count');
    trackGameEvent('stage_start', {
      stage: Number(state.stage + 1),
      practice: Number(state.practice),
    });
    dispatch({
      type: 'start',
      random: Math.random(),
      randoms: Array.from({ length: 256 }, () => Math.random()),
    });
  }, [getSound, state.stage, state.practice]);

  // 사용자 입력을 처리하는 공통 경로.
  // reducer를 미리 한 번 돌려 "입력 직후의 결과"를 얻고, 그에 맞는 효과음을 즉시 재생한 뒤 실제로 dispatch합니다.
  // (프레임 루프를 기다리지 않아 소리 지연이 줄어듭니다.)
  const emitInput = useCallback(
    (action: Action) => {
      const after = reducer(state, action),
        sounds = inputSounds(state, after);
      // 1단계 충돌음을 입력 시점에 냈다면 마커를 남겨 프레임 비교 로직에서의 중복 재생을 막습니다.
      if (state.stage === 0 && sounds.includes('impact'))
        inputSoundMark.current = {
          run: state.run,
          stageRun: state.stageRun,
          failures:
            (after.gameData?.failures ?? 0) +
            (after.gameData?.phase === 'hit' ? 1 : 0),
        };
      for (const kind of sounds) soundRef.current?.playSfx(kind);
      dispatch(action);
    },
    [state],
  );

  // 단계별 "행동" 입력(회피, 번호 선택, 정지, 방향 입력). offset은 마지막 프레임 이후 경과 시간으로,
  // 반응속도 측정의 정밀도를 높이는 데 쓰입니다.
  const act = useCallback(
    (value?: number, direction?: Direction) => {
      getSound().ensureAudio();
      emitInput({
        type: 'action',
        value,
        direction,
        offset: last.current ? Math.max(0, (performance.now() - last.current) / 1000) : 0,
        random: Math.random(),
        randoms: Array.from({ length: 256 }, () => Math.random()),
      });
    },
    [getSound, emitInput],
  );

  // 3단계 이동 입력: 방향키를 누르기 시작/떼었을 때 상태에 반영
  const move = (direction: Direction) => dispatch({ type: 'move', direction });
  const stop = (direction: Direction) => dispatch({ type: 'stop', direction });

  // 처음 화면으로 돌아가기
  const goHome = () => {
    soundRef.current?.resumeAudio();
    dispatch({ type: 'home' });
  };

  // 일시정지/재개 토글. 오디오도 함께 멈추거나 재개하고,
  // 일시정지 시간이 게임 시간에 섞이지 않도록 마지막 프레임 시각을 갱신해 offset을 전달합니다.
  const togglePause = useCallback(() => {
    if (state.mode === 'pause') soundRef.current?.resumeAudio();
    else if (state.mode === 'play' || state.mode === 'countdown') soundRef.current?.pauseAudio();
    const now = performance.now(),
      offset = last.current ? Math.max(0, (now - last.current) / 1000) : 0;
    last.current = now;
    dispatch({ type: state.mode === 'pause' ? 'resume' : 'pause', offset });
  }, [state.mode]);

  // 키 눌림 처리. 단계마다 사용하는 키가 다릅니다.
  //  1단계: D/F 회피 · 3단계: 방향키/WASD 이동 · 4단계: W/S/O/K 깃발 · 5단계: 스페이스 · 6단계: 방향키 순서 입력
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    // Esc: 일시정지/설정 토글
    if (e.code === 'Escape' && !e.repeat) {
      e.preventDefault();
      togglePause();
      return;
    }
    // 플레이 중이 아니거나 키 반복 입력(꾹 누름)이면 무시
    if (state.mode !== 'play' || e.repeat) return;
    const k = e.code.toLowerCase();
    if (state.stage === 0 && (k === 'keyd' || k === 'keyf')) {
      e.preventDefault();
      act();
    }
    if (state.stage === 2) {
      // 방향키와 WASD를 모두 지원
      const direction: Direction | undefined =
        k === 'arrowup' || k === 'keyw'
          ? 'up'
          : k === 'arrowdown' || k === 'keys'
            ? 'down'
            : k === 'arrowleft' || k === 'keya'
              ? 'left'
              : k === 'arrowright' || k === 'keyd'
                ? 'right'
                : undefined;
      if (direction) {
        e.preventDefault();
        move(direction);
      }
    }
    if (state.stage === 3) {
      // W=청기 올리기(0), S=청기 내리기(1), O=백기 올리기(2), K=백기 내리기(3)
      const value = k === 'keyw' ? 0 : k === 'keys' ? 1 : k === 'keyo' ? 2 : k === 'keyk' ? 3 : -1;
      if (value >= 0) {
        e.preventDefault();
        act(value);
      }
    }
    if (state.stage === 4 && k === 'space') {
      e.preventDefault();
      act();
    }
    if (state.stage === 5) {
      // 6단계는 방향키만 사용 (WASD 미지원)
      const direction: Direction | undefined =
        k === 'arrowup'
          ? 'up'
          : k === 'arrowdown'
            ? 'down'
            : k === 'arrowleft'
              ? 'left'
              : k === 'arrowright'
                ? 'right'
                : undefined;
      if (direction) {
        e.preventDefault();
        act(undefined, direction);
      }
    }
  };

  // ----- 화면에 전달할 파생 값 계산 -----
  const d = state.gameData; // 현재 단계의 진행 데이터 (없으면 null)
  // HUD 문구 3개: [상태 요약, 안내 왼쪽, 안내 오른쪽]
  const hudText = d ? hud(state.stage, d, state.mode === 'countdown') : ['', '', ''];
  // 6개 단계 점수의 합계와 평균(0~100), 평균으로 환산한 피지컬 나이/등급
  const total = state.scores.reduce<number>((sum, value) => sum + (value ?? 0), 0),
    avg = Math.round(total / 6);
  const { ageDisplay, grade } = scoreProfile(avg);
  // 가장 잘한/못한 단계의 점수 (결과 화면의 강점·추천 표시에 사용)
  const best = Math.max(...state.scores.map((value) => value ?? 0));
  const worst = Math.min(...state.scores.map((value) => value ?? 0));

  // 설정 토글: 사운드 엔진과 React 상태를 함께 갱신
  const toggleMusic = () => {
    const next = !musicEnabled;
    getSound().setMusicEnabled(next);
    setMusicEnabled(next);
  };
  const toggleSfx = () => {
    const next = !sfxEnabled;
    getSound().setSfxEnabled(next);
    setSfxEnabled(next);
  };

  // 포커스가 게임 영역 밖으로 나가면 3단계의 눌린 방향키를 모두 해제합니다.
  // (키를 뗀 이벤트를 못 받아 캐릭터가 계속 움직이는 문제 방지)
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (state.stage === 2 && !event.currentTarget.contains(event.relatedTarget)) dirs.forEach(stop);
  };

  // 키에서 손을 뗐을 때: 3단계 이동 중지 처리
  const handleKeyUp = (event: KeyboardEvent<HTMLDivElement>) => {
    if (state.stage !== 2) return;
    const key = event.code.toLowerCase();
    const direction: Direction | undefined =
      key === 'arrowup' || key === 'keyw'
        ? 'up'
        : key === 'arrowdown' || key === 'keys'
          ? 'down'
          : key === 'arrowleft' || key === 'keya'
            ? 'left'
            : key === 'arrowright' || key === 'keyd'
              ? 'right'
              : undefined;
    if (direction) {
      event.preventDefault();
      stop(direction);
    }
  };

  // 2단계(모기 잡기) 포인터 입력: 이동/이탈/클릭을 reducer로 전달
  const onMosquitoMove = (x: number, y: number) => dispatch({ type: 'hover', x, y });
  const onMosquitoLeave = () => dispatch({ type: 'leave' });
  const onMosquitoHit = (x: number, y: number) => {
    getSound().ensureAudio();
    emitInput({
      type: 'pointer',
      x,
      y,
      random: Math.random(),
      randoms: Array.from({ length: 256 }, () => Math.random()),
    });
  };
  // 단계 결과 화면에서 다음 단계(또는 결과/홈)로 이동
  const onNext = () => dispatch({ type: 'next' });

  // 화면 렌더링은 GameView에 위임합니다.
  return (
    <GameView
      state={state}
      musicEnabled={musicEnabled}
      sfxEnabled={sfxEnabled}
      root={root}
      canvas={canvas}
      radar={radar}
      d={d}
      hudText={hudText}
      total={total}
      avg={avg}
      ageDisplay={ageDisplay}
      grade={grade}
      best={best}
      worst={worst}
      onKeyDown={key}
      onKeyUp={handleKeyUp}
      onBlur={handleBlur}
      onToggleMusic={toggleMusic}
      onToggleSfx={toggleSfx}
      onStart={start}
      onBeginStage={beginStage}
      onTogglePause={togglePause}
      onGoHome={goHome}
      onAction={act}
      onMove={move}
      onStop={stop}
      onNext={onNext}
      onMosquitoMove={onMosquitoMove}
      onMosquitoLeave={onMosquitoLeave}
      onMosquitoHit={onMosquitoHit}
    />
  );
}
