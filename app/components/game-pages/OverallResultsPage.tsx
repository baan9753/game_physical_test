'use client';

import { skillNames } from '../../../lib/game-data';
import type { OverallResultsPageModel } from './types';

/** 종합 결과: 평균 점수, 환산 나이, 능력 차트를 표시합니다. */
export default function OverallResultsPage({ model }: { model: OverallResultsPageModel }) {
  const { state, radar, ageDisplay, grade, avg, onGoHome, t } = model;
  const skills = skillNames.map((key) => t(key));
  const scores = skills.map((_, i) => state.scores.at(i) ?? 0);
  const top = Math.max(...scores), low = Math.min(...scores);
  const strengths = skills.map((skill, i) => ({ skill, score: scores[i] })).filter((item) => item.score === top);
  const weakSpots = skills.map((skill, i) => ({ skill, score: scores[i] })).filter((item) => item.score === low);
  const userTypes = [
    'typeReaction', 'typeAim', 'typeEvasion', 'typeJudgment', 'typeTiming', 'typeSpeed',
  ] as const;
  const leader = scores.indexOf(top);
  const userType = t(userTypes[leader] ?? 'typeBalanced');

  return (
    <section className="gp-home">
      <div className="gp-card gp-result-card">
        <div className="gp-result-grid">
          {/* 왼쪽: 종합 평균으로 환산한 피지컬 나이와 게임 등급 */}
          <div className="gp-result-age-col">
            <div className="gp-age-display">
              <h2 className="gp-result-heading">{t('ageHeading')}</h2>
              <div className="gp-age-summary">
                <span>{t('score', { score: avg })}</span>
                <span className="gp-age-separator" aria-hidden="true">·</span>
                <span className="gp-age-num">{ageDisplay}</span>
              </div>
              <div className="gp-age-title">{grade}</div>
              <section className="gp-result-insights" aria-label={t('analysis')}>
                  <p>
                  <span className="gp-insight-label">{t('playType')}</span>
                  <b className="gp-play-type">{userType}</b>{top >= 80
                    ? t('strongType', { skill: skills[leader] })
                    : t('growingType')}</p>
                <p>
                  <span className="gp-insight-label">{t('strengths')}</span>
                  {t('strongScores', { scores: strengths.map((item) => t('skillScore', item)).join(' · ') })}
                  {' '}{t('weakScores', { scores: weakSpots.map((item) => t('skillScore', item)).join(' · ') })}
                </p>
              </section>
            </div>
          </div>
          {/* 오른쪽: 능력별 육각형 차트(Canvas는 game.tsx에서 그림)와 여섯 단계 점수 목록 */}
          <div className="gp-result-abilities">
            <div className="gp-chart-wrap">
              <h3>{t('skillsTitle')}</h3>
              <canvas
                ref={radar}
                width={600}
                height={410}
                aria-label={t('radar')}
                style={{ width: '100%', height: 'auto' }}
              />
            </div>
            <div className="gp-scores">
              {skills.map((skill, i) => (
                <div key={skill} className="gp-result-score">
                  <span>{skill}</span>
                  <b>{t('score', { score: scores[i] })}</b>
                  <span className="gp-result-score-track" aria-hidden="true">
                    <span style={{ width: `${Math.max(0, Math.min(100, scores[i]))}%` }} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="gp-result-footer">
        <p className="gp-home-notice">
          {t('ageNotice')}
        </p>
        {/* 홈 화면으로 돌아가 처음부터 다시 도전 */}
        <button className="gp-btn gp-primary" onClick={onGoHome}>
          {t('tryAgain')}
        </button>
        </div>
      </div>
    </section>
  );
}
