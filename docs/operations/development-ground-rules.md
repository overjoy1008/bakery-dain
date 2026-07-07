# Development Ground Rules

## General

- 구현 전에 도메인 의도를 문서와 타입으로 먼저 고정합니다.
- 기능은 고객 예약, 관리자 운영, 데이터 무결성 중 하나에 직접 기여해야 합니다.
- 레퍼런스 코드를 가져올 때는 Bakery Dain 도메인에 맞게 이름과 책임을 바꿉니다.

## Code Style

- TypeScript strict 방향을 유지합니다.
- UI와 비즈니스 로직을 섞지 않습니다.
- 가격/날짜/상태 포맷팅은 공통 유틸로 분리합니다.
- magic string은 status enum 또는 const로 모읍니다.

## Frontend

- 페이지 컴포넌트는 조립에 집중합니다.
- 반복 UI는 `components/` 또는 feature 내부 컴포넌트로 분리합니다.
- API 호출은 hooks/service 계층에 둡니다.
- 폼 검증은 사용자 친화적인 메시지를 제공합니다.

## Backend

- mutation endpoint는 항상 schema validation을 거칩니다.
- 관리자 mutation은 audit log 기록을 고려합니다.
- 예약 생성은 서버 기준 가격과 재고로만 확정합니다.
- 개인정보를 로그에 남기지 않습니다.

## Testing

우선순위:

1. 예약 생성 시 품절/마감 검증
2. 날짜별 메뉴 수량 차감
3. 관리자 날짜/메뉴 수정
4. 예약 폼 validation
5. 모바일 캘린더 UI

## Definition of Done

- 기능이 문서화된 흐름과 맞습니다.
- 모바일과 데스크탑에서 핵심 흐름이 깨지지 않습니다.
- 서버 검증이 프론트 검증보다 우선합니다.
- 에러 상태가 화면에 표시됩니다.
- 관련 문서 또는 타입이 함께 갱신됩니다.
