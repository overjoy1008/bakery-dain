# Delivery Plan

## Working Method

작은 단위로 기능을 완성하고 확인합니다. 한 번에 모든 쇼핑몰 기능을 만드는 대신, 예약 가능일 중심 MVP를 먼저 안정화합니다.

## Milestones

### M1. Planning Complete

- README
- 제품 계획
- KPI
- 디자인 방향
- 아키텍처
- API/DB 초안
- 관리자 계획

### M2. Static Prototype

- 홈 화면
- 메뉴 카드
- 캘린더 preview
- 예약 폼 mock
- 완료 화면 mock
- 관리자 dashboard mock

### M3. API Prototype

- D1 schema
- menu API
- pickup day API
- reservation API
- admin auth stub

### M4. Integrated MVP

- 고객 예약 생성
- 날짜별 메뉴 조회
- 수량 차감
- 관리자 날짜/메뉴 관리
- 예약 목록/상태 변경

### M5. Launch Polish

- 실제 이미지 반영
- 문구 정리
- 접근성 점검
- 모바일 QA
- 배포 설정
- 운영자 사용 시나리오 리허설

## QA Checklist

- 예약 가능한 날짜만 선택되는가
- 마감 날짜는 제출이 막히는가
- 품절 메뉴는 제출이 막히는가
- 동시에 주문해도 수량이 초과되지 않는가
- 관리자 변경이 고객 캘린더에 반영되는가
- 예약 완료 화면의 금액이 서버 계산과 일치하는가
- 모바일에서 캘린더와 폼이 불편하지 않은가
