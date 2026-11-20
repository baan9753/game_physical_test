'use client';

import { stageNames, skillNames, timingDetails } from '../../../lib/game-data';
import { formatMessage, type CopyKey } from '../../../lib/game-copy';
import type { StageCompletePageModel } from './types';

const timerLegend: { color: string; grade: CopyKey; score: string; range: string; label: CopyKey }[] = [
  { color: '#a64b45', grade: 'miss', score: '0–59', range: '2', label: 'overRange' },
  { color: '#c87549', grade: 'bad', score: '60–69', range: '1.5–2', label: 'range' },
  { color: '#d39d4a', grade: 'good', score: '70–79', range: '1–1.5', label: 'range' },
  { color: '#ddc34c', grade: 'cool', score: '80–89', range: '0.5–1', label: 'range' },
  { color: '#9fc957', grade: 'great', score: '90–99', range: '0.2–0.5', label: 'range' },
  { color: '#72bd64', grade: 'perfect', score: '100', range: '0.2', label: 'underRange' },
];

/** 단계 결과: 단계별 점수와 전용 기록을 보여주고 다음 화면으로 이동합니다. */
export default function StageCompletePage({ model }: { model: StageCompletePageModel }) {
  const { state, d, onNext, onBeginStage, t } = model;

  // 단계 데이터가 없으면 아무것도 그리지 않습니다.
  if (!d) return null;

  return (
    <>
      {/* 상단 바: 단계 이름 + (연습) 완료 표시, 측정한 능력 이름 */}
      <div className="gp-topbar">
        <div className="gp-hud">
          <b>
            {t(state.practice ? 'practiceDone' : 'stageDone', { name: t(stageNames[state.stage]) })}
          </b>
          <span>{t(skillNames[state.stage])}</span>
        </div>
      </div>
      <section className="gp-home">
        <div className="gp-card gp-dialog gp-stage-complete">
          <span className="gp-menu-eyebrow">{state.practice ? t('practiceRecord') : t('stageRecord', { stage: state.stage + 1 })}</span>
          {/* 공통 결과 점수. 1단계와 5단계는 전용 상세 기록을 추가 표시합니다. */}
          <h2>{t('score', { score: d.score })}</h2>
          {/* 1·5단계는 아래 전용 기록이 있으므로 일반 결과 메시지를 생략합니다. */}
          {state.stage !== 0 && state.stage !== 4 && <p>{formatMessage(t, d.message)}</p>}
          {/* 1단계 전용: 반응속도 평균·최고·최저 (기록이 없으면 '기록 없음') */}
          {state.stage === 0 && (
            <div className="gp-reaction-stats">
              <div>
                <span>{t('reactionAvg')}</span>
                <b>
                  {d.reactions.length
                    ? `${Math.round(d.reactions.reduce((a, b) => a + b, 0) / d.reactions.length)}ms`
                    : t('noRecord')}
                </b>
              </div>
              <div>
                <span>{t('reactionBest')}</span>
                {/* 가장 짧은 시간이 가장 빠른 반응 */}
                <b>
                  {d.reactions.length ? `${Math.round(Math.min(...d.reactions))}ms` : t('noRecord')}
                </b>
              </div>
              <div>
                <span>{t('reactionWorst')}</span>
                {/* 가장 긴 시간이 가장 느린 반응 */}
                <b>
                  {d.reactions.length ? `${Math.round(Math.max(...d.reactions))}ms` : t('noRecord')}
                </b>
              </div>
            </div>
          )}
          {/* 5단계 전용: 세 차례 측정 기록과 오차 구간 시각화 */}
          {state.stage === 4 && (
            <div className="gp-measures" aria-label={t('threeAttempts')}>
              {d.measurements.map((v, i) => (
                <div className="gp-measure" key={i}>
                  {/* 회차, 측정 시간, 빠름/늦음 여부, 오차, 판정 등급과 점수 */}
                  <div className="gp-measure-meta">
                    <span>
                      {t('attempt', { attempt: i + 1, time: v.toFixed(2) })}
                    </span>
                    <b>
                      {formatMessage(t, timingDetails(v, d.timerScores.at(i) ?? 0))}
                    </b>
                  </div>
                  {/* 0~12초 범위 막대: 채움 길이와 빨간 마커가 측정값 위치를 나타냅니다. */}
                  <div className="gp-measure-track">
                    <div
                      className="gp-measure-fill"
                      style={{ width: `${Math.min(100, (v / 12) * 100)}%` }}
                    />
                    <span className="gp-measure-target" />
                    <span
                      className="gp-measure-marker"
                      style={{ left: `${Math.min(100, (v / 12) * 100)}%` }}
                    />
                  </div>
                  <div className="gp-measure-meta">
                    <span>{t('seconds', { time: 0 })}</span>
                    <span>{t('timeTarget', { time: 10 })}</span>
                    <span>{t('timePlus', { time: 12 })}</span>
                  </div>
                </div>
              ))}
              {/* 막대 배경색과 대응되는 점수 구간 범례 */}
              <div className="gp-timer-legend">
                {timerLegend.map(({ color, grade, score, range, label }) => (
                  <span key={grade}>
                    <i style={{ background: color }} />
                    {t(label, { grade: t(grade), score, range })}
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* 연습 결과에서는 다시 연습하거나 종료할 수 있고, 전체 테스트는 기존 흐름을 유지합니다. */}
          {state.practice ? (
            <div className="gp-stage-complete-actions">
              <button className="gp-btn" onClick={onBeginStage}>
                {t('retryPractice')}
              </button>
              <button className="gp-btn gp-primary" onClick={onNext}>
                {t('endPractice')}
              </button>
            </div>
          ) : (
            <button className="gp-btn gp-primary" onClick={onNext}>
              {state.stage < 5 ? t('nextStage') : t('viewResults')}
            </button>
          )}
        </div>
      </section>
    </>
  );
}
