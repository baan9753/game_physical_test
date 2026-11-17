'use client';

import { skills } from '../../../lib/game-data';
import type { OverallResultsPageModel } from './types';

/** 종합 결과: 평균 점수, 환산 나이, 능력 차트를 표시합니다. */
export default function OverallResultsPage({ model }: { model: OverallResultsPageModel }) {
  const { state, radar, ageDisplay, grade, avg, onGoHome } = model;
  const scores = skills.map((_, i) => state.scores.at(i) ?? 0);
  const top = Math.max(...scores), low = Math.min(...scores);
  const strengths = skills.map((skill, i) => ({ skill, score: scores[i] })).filter((item) => item.score === top);
  const weakSpots = skills.map((skill, i) => ({ skill, score: scores[i] })).filter((item) => item.score === low);
  const userTypes = [
    '번개 반응형', '모기 사냥꾼', '회피 생존가', '지시문 해독왕', '초시계 장인', '로켓 조종사',
  ];
  const leader = scores.indexOf(top);
  const userType = userTypes[leader] ?? '균형 잡힌 도전자';

  return (
    <section className="gp-home">
      <div className="gp-card gp-result-card">
        <div className="gp-result-grid">
          {/* 왼쪽: 종합 평균으로 환산한 피지컬 나이와 게임 등급 */}
          <div className="gp-result-age-col">
            <div className="gp-age-display">
              <h2 className="gp-result-heading">오늘의 게임 피지컬 나이</h2>
              <div className="gp-age-summary">
                <span>{avg}점</span>
                <span className="gp-age-separator" aria-hidden="true">·</span>
                <span className="gp-age-num">{ageDisplay}</span>
              </div>
              <div className="gp-age-title">{grade}</div>
              <section className="gp-result-insights" aria-label="결과 분석">
                  <p>
                  <span className="gp-insight-label">나의 플레이 타입</span>
                  <b className="gp-play-type">{userType}</b>{top >= 80
                    ? `${skills[leader]} 능력이 돋보이는 집중 공략형 플레이어예요.`
                    : '아직 숨은 주특기를 찾는 중인 성장형 플레이어예요. 다음 판에서 기록을 갱신해보세요!'}</p>
                <p>
                  <span className="gp-insight-label">강점과 보완할 점</span>
                  {strengths.map(({ skill, score }) => `${skill} ${score}점`).join(' · ')}에서 특히 좋은 모습을 보였어요.
                  {' '}{weakSpots.map(({ skill, score }) => `${skill} ${score}점`).join(' · ')}은 다음 도전에서 조금 더 연습해보면 좋아요.
                </p>
              </section>
            </div>
          </div>
          {/* 오른쪽: 능력별 육각형 차트(Canvas는 game.tsx에서 그림)와 여섯 단계 점수 목록 */}
          <div className="gp-result-abilities">
            <div className="gp-chart-wrap">
              <h3>능력별 점수</h3>
              <canvas
                ref={radar}
                width={600}
                height={410}
                aria-label="6개 능력 점수 육각형 차트"
                style={{ width: '100%', height: 'auto' }}
              />
            </div>
            <div className="gp-scores">
              {skills.map((skill, i) => (
                <div key={skill} className="gp-result-score">
                  <span>{skill}</span>
                  <b>{state.scores.at(i) ?? 0}점</b>
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
          이 나이는 게임 점수를 재미로 환산한 결과이며 실제 신체 나이를 뜻하지 않습니다.
        </p>
        {/* 홈 화면으로 돌아가 처음부터 다시 도전 */}
        <button className="gp-btn gp-primary" onClick={onGoHome}>
          다시 도전
        </button>
        </div>
      </div>
    </section>
  );
}
