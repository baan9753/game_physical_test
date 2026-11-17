게이머 피지컬 테스트

## 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 을 엽니다.

## 구조 (MVVM)

- `app/game.tsx`: ViewModel. React 상태, 입력 이벤트, 화면과 게임 모델의 연결을 관리합니다.
- `app/components/GameView.tsx`: View 라우터. 현재 모드에 해당하는 페이지를 표시합니다.
- `app/components/game-pages/`: 홈, 단계 안내, 플레이, 단계 결과, 종합 결과 페이지를 각각 분리합니다. 공통 ViewModel 타입은 `types.ts`에 있습니다.
- `lib/game-data.ts`: 게임 이름, 규칙, 조작 안내, 문제 데이터, 등급 정보를 보관합니다.
- `lib/game-engine.ts`: 상태 전이, 게임 규칙, 점수 계산, HUD 텍스트를 처리합니다.
- `lib/game-renderer.ts`: 캔버스 장면과 결과 육각형 차트를 그립니다.
- `lib/game-sound.ts`: 배경 음악과 효과음을 관리합니다.
- `lib/game-types.ts`: 게임 상태와 입력에 사용하는 TypeScript 타입입니다.
- `lib/game-events.ts`: GA 이벤트 연결 지점입니다.
- `app/globals.css`: 픽셀 아트 UI 스타일입니다.
