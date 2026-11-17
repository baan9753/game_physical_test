'use client';

import { names, skills } from '../../../lib/game-data';
import type { HomePageModel } from './types';

/** 메인 메뉴: 개별 단계 연습과 전체 테스트 시작을 담당합니다. */
export default function HomePage({ model }: { model: HomePageModel }) {
  const { onStart } = model;

  return (
    <section className="gp-home">
      <div className="gp-card gp-menu-card">
        <span className="gp-menu-eyebrow">여섯 가지 능력 · 하나의 기록</span>
        <h1>게임 피지컬 테스트</h1>
        <p className="gp-home-sub">
          반응부터 에임, 판단까지
          <br />
          여섯 가지 미니게임에 도전하세요.
        </p>
        {/* 단계 이름 목록: 클릭하면 해당 단계를 연습 모드로 시작합니다. */}
        <div className="gp-menu-section-heading"><span>원하는 단계부터 연습하기</span><small>01 — 06</small></div>
        <div className="gp-grid gp-stage-grid">
          {names.map((name, i) => (
            <button className={`gp-btn gp-stage-tile gp-stage-tone-${i}`} key={name} onClick={() => onStart(i, true)}>
              <span className="gp-stage-tile-top">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
                  <path d={[
                    'M12 2 4 5v7l3 5 5 4 5-4 3-5V5ZM13 6l-5 7h4l-1 5 5-8h-4Z',
                    'M12 2v4m0 12v4M2 12h4m12 0h4M7 7h10v10H7ZM10 12h4m-2-2v4',
                    'M10 9h4v6h-4ZM3 3h3v3H3Zm15 0h3v3h-3ZM3 18h3v3H3Zm15 0h3v3h-3Z',
                    'M4 21V3h7v8H4m9 10V6h7v8h-7',
                    'M8 2h8m-4 0v3M6 6h12l3 3v9l-3 3H6l-3-3V9ZM12 8v6h4',
                    'M9 16H6v-5l3-3m6 8h3v-5l-3-3M9 16V6l3-4 3 4v10ZM10 19v3m4-3v3M11 8h2v3h-2Z',
                  ][i]} />
                </svg>
                <small>{String(i + 1).padStart(2, '0')}</small>
              </span>
              <b>{name}</b>
              <span className="gp-stage-tile-bottom"><span>{skills[i]}</span><span aria-hidden="true">↗</span></span>
            </button>
          ))}
        </div>
        {/* 1단계부터 6단계까지 이어서 진행하는 전체 측정 시작 (practice = false) */}
        <div className="gp-menu-start">
          <span>나의 게임 피지컬은 몇 살일까요?<small>6단계를 모두 마치면 종합 결과를 확인할 수 있어요.</small></span>
          <button className="gp-btn gp-primary" onClick={() => onStart(0, false)}>전체 테스트 시작 <span aria-hidden="true">→</span></button>
        </div>
      </div>
    </section>
  );
}
