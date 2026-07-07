# Admin Plan

## Admin Philosophy

관리자 페이지는 "작은 베이커리 운영자가 당장 오늘 쓸 수 있는 도구"여야 합니다. 많은 기능보다 실수 없이 빨리 조작하는 것이 중요합니다.

## MVP Navigation

```txt
Dashboard
Calendar
Menus
Reservations
Settings
```

## Dashboard

표시 항목:

- 오늘 예약 수
- 이번 주 예약 수
- 이번 주 예상 매출
- 미확인 예약 수
- 마감 임박 날짜
- 인기 메뉴

## Calendar Management

날짜별 설정:

- 예약 가능
- 마감
- 쉬는 날
- 숨김
- 픽업 시작/종료 시간
- 주문 마감 시각
- 고객에게 보일 메모

날짜별 메뉴 설정:

- 이 날짜에 판매할 메뉴 선택
- 메뉴별 오픈 수량
- 메뉴별 남은 수량 확인
- 날짜 안에서 메뉴 순서 조정

## Menu Management

메뉴 필드:

- 이름
- 카테고리
- 가격
- 설명
- 대표 이미지
- 전체 품절 여부
- 노출 여부
- 정렬 순서

## Reservation Management

예약 목록 컬럼:

- 예약 번호
- 픽업 날짜/시간
- 고객명
- 연락처
- 메뉴 요약
- 총액
- 상태
- 생성 시각

상태 변경:

```txt
submitted -> confirmed -> preparing -> ready -> picked_up
submitted/confirmed -> cancelled
```

## Admin UX Rules

- 저장 버튼은 변경이 있을 때만 강조합니다.
- 품절이나 마감처럼 고객에게 즉시 영향을 주는 변경은 확인 단계를 둡니다.
- 날짜별 재고가 0이 되면 고객 화면에서 자동으로 마감 또는 품절처럼 보이게 합니다.
- 예약 상세에는 상태 변경 기록 또는 audit log를 표시할 수 있게 설계합니다.

## Authentication

- MVP는 단일 owner 계정 중심으로 시작합니다.
- 비밀번호는 해시로 저장합니다.
- 관리자 API는 인증 middleware를 반드시 통과합니다.
- 세션 만료 시 관리자 화면은 로그인으로 돌려보냅니다.
