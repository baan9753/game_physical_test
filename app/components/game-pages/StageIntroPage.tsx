'use client';

import { guides, stageNames, skillNames } from '../../../lib/game-data';
import type { StageIntroPageModel } from './types';

/** 단계 안내: 현재 단계의 규칙과 조작법을 보여줍니다. */
export default function StageIntroPage({ model }: { model: StageIntroPageModel }) {
  const { state, onBeginStage, t } = model;

  return (
    <>
      {/* 상단 바: 단계 이름과 진행 위치 (예: 03 / 06) */}
      <div className="gp-topbar">
        <div className="gp-hud">
          <b>{t(stageNames[state.stage])}</b>
          <span>0{state.stage + 1} / 06</span>
        </div>
      </div>
      <section className="gp-home">
        <div className="gp-card gp-intro-card">
          <div className="gp-stage-progress" aria-label={t('stageGuide', { stage: state.stage + 1 })}>
            {stageNames.map((name, i) => <span key={name} className={i === state.stage ? 'is-current' : i < state.stage ? 'is-done' : ''} aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>)}
          </div>
          {/* 단계 번호와 측정하는 능력 이름 */}
          <span className="gp-tag">
            {t('stageNumber', { stage: state.stage + 1 })} · {t(skillNames[state.stage])}
          </span>
          <h1>{t(stageNames[state.stage])}</h1>
          {/* 규칙과 조작법을 별도 패널로 보여줍니다. guides는 단계별 [규칙, 조작법] 문구 배열입니다. */}
          <div className="gp-guide-grid">
            <section
              className="gp-guide-section gp-guide-rules"
              aria-labelledby="guide-rules-title"
            >
              <h2 id="guide-rules-title">{t('rules')}</h2>
              <p className="gp-intro-desc">{t(guides[state.stage][0])}</p>
            </section>
            <section
              className="gp-guide-section gp-guide-controls"
              aria-labelledby="guide-controls-title"
            >
              <h2 id="guide-controls-title">{t('controls')}</h2>
              <p className="gp-intro-help">{t(guides[state.stage][1])}</p>
            </section>
          </div>
          {/* 누르면 카운트다운이 시작됩니다. */}
          <button className="gp-btn gp-primary" onClick={onBeginStage}>
            {t('start')}
          </button>
        </div>
      </section>
    </>
  );
}
