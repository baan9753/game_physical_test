'use client';

import { names, skills, timerGradeFromScore } from '../../../lib/game-data';
import type { StageCompletePageModel } from './types';

/** 단계 결과: 단계별 점수와 전용 기록을 보여주고 다음 화면으로 이동합니다. */
export default function StageCompletePage({ model }: { model: StageCompletePageModel }) {
  const { state, d, onNext, onBeginStage } = model;

  // 단계 데이터가 없으면 아무것도 그리지 않습니다.
  if (!d) return null;

  return (
    <>
      {/* 상단 바: 단계 이름 + (연습) 완료 표시, 측정한 능력 이름 */}
      <div className="gp-topbar">
        <div className="gp-hud">
          <b>
            {names.at(state.stage)} {state.practice ? '연습 완료' : '완료'}
          </b>
          <span>{skills.at(state.stage)}</span>
        </div>
      </div>
      <section className="gp-home">
        <div className="gp-card gp-dialog gp-stage-complete">
          <span className="gp-menu-eyebrow">{state.practice ? '연습 기록' : `${state.stage + 1}단계 기록`}</span>
          {/* 공통 결과 점수. 1단계와 5단계는 전용 상세 기록을 추가 표시합니다. */}
          <h2>{d.score}점</h2>
          {/* 1·5단계는 아래 전용 기록이 있으므로 일반 결과 메시지를 생략합니다. */}
          {state.stage !== 0 && state.stage !== 4 && <p>{d.message}</p>}
          {/* 1단계 전용: 반응속도 평균·최고·최저 (기록이 없으면 '기록 없음') */}
          {state.stage === 0 && (
            <div className="gp-reaction-stats">
              <div>
                <span>평균 반응속도</span>
                <b>
                  {d.reactions.length
                    ? `${Math.round(d.reactions.reduce((a, b) => a + b, 0) / d.reactions.length)}ms`
                    : '기록 없음'}
                </b>
              </div>
              <div>
                <span>최고 반응속도</span>
                {/* 가장 짧은 시간이 가장 빠른 반응 */}
                <b>
                  {d.reactions.length ? `${Math.round(Math.min(...d.reactions))}ms` : '기록 없음'}
                </b>
              </div>
              <div>
                <span>최저 반응속도</span>
                {/* 가장 긴 시간이 가장 느린 반응 */}
                <b>
                  {d.reactions.length ? `${Math.round(Math.max(...d.reactions))}ms` : '기록 없음'}
                </b>
              </div>
            </div>
          )}
          {/* 5단계 전용: 세 차례 측정 기록과 오차 구간 시각화 */}
          {state.stage === 4 && (
            <div className="gp-measures" aria-label="세 차례 10초 측정 결과">
              {d.measurements.map((v, i) => (
                <div className="gp-measure" key={i}>
                  {/* 회차, 측정 시간, 빠름/늦음 여부, 오차, 판정 등급과 점수 */}
                  <div className="gp-measure-meta">
                    <span>
                      {i + 1}회차 · {v.toFixed(2)}초
                    </span>
                    <b>
                      {v < 10 ? '빨랐어요' : '늦었어요'} · 오차 {Math.abs(v - 10).toFixed(2)}초 ·{' '}
                      {/* 점수 → 등급 이름 변환 (100 퍼펙트, 90 그레이트, 80 쿨, 70 굿, 50 배드, 그 외 미스) */}
                      {timerGradeFromScore(d.timerScores.at(i) ?? 0)}{' '}
                      {d.timerScores.at(i)}점
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
                    <span>0초</span>
                    <span>목표 10초</span>
                    <span>12초+</span>
                  </div>
                </div>
              ))}
              {/* 막대 배경색과 대응되는 점수 구간 범례 */}
              <div className="gp-timer-legend">
                <span>
                  <i style={{ background: '#a64b45' }} />
                  MISS 0~59점 · 오차 2초 초과
                </span>
                <span>
                  <i style={{ background: '#c87549' }} />
                  BAD 60~69점 · 오차 1.5~2초
                </span>
                <span>
                  <i style={{ background: '#d39d4a' }} />
                  GOOD 70~79점 · 오차 1~1.5초
                </span>
                <span>
                  <i style={{ background: '#ddc34c' }} />COOL 80~89점 · 오차 0.5~1초
                </span>
                <span>
                  <i style={{ background: '#9fc957' }} />GREAT 90~99점 · 오차 0.2~0.5초
                </span>
                <span>
                  <i style={{ background: '#72bd64' }} />
                  퍼펙트 100점 · 0.2초 이내
                </span>
              </div>
            </div>
          )}
          {/* 연습 결과에서는 다시 연습하거나 종료할 수 있고, 전체 테스트는 기존 흐름을 유지합니다. */}
          {state.practice ? (
            <div className="gp-stage-complete-actions">
              <button className="gp-btn" onClick={onBeginStage}>
                다시 연습
              </button>
              <button className="gp-btn gp-primary" onClick={onNext}>
                연습 끝내기
              </button>
            </div>
          ) : (
            <button className="gp-btn gp-primary" onClick={onNext}>
              {state.stage < 5 ? '다음 단계' : '결과 보기'}
            </button>
          )}
        </div>
      </section>
    </>
  );
}
