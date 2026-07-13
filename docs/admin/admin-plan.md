# Admin Plan

## Admin Philosophy

관리자 페이지는 "작은 베이커리 운영자가 당장 오늘 쓸 수 있는 도구"여야 합니다. 많은 기능보다 실수 없이 빨리 조작하는 것이 중요합니다.

## MVP Navigation

```txt
Dashboard
Reservations
Members
Menus
Pickup Rules
Settings
```

관리자 계정은 일반 로그인 화면을 공유합니다. 로그인 성공 후 `user_type=admin` 또는 서버의 owner admin 세션으로 판정되면 `/admin`으로, 일반 회원이면 `/mypage`로 이동합니다.

## Dashboard

표시 항목:

- 오늘 예약 수
- 이번 주 예약 수
- 이번 주 예상 매출
- 입금 확인 대기 수
- 마감 임박 날짜
- 인기 메뉴
- 오늘 픽업 예정 목록

첫 화면의 목적은 "오늘 뭘 만들어야 하는지"와 "입금 확인이 필요한 주문이 있는지"를 즉시 보여주는 것입니다.

## Member Management

회원 조회는 TereneHandover의 `MembersTableToolbar`처럼 검색, 필터, 새로고침이 빠른 테이블을 참고하되 다닷네에 필요한 필드만 둡니다.

목록 컬럼:

- 회원 ID
- 사이트 아이디
- 이름
- 연락처
- 이메일
- 주소 요약
- 연락처 인증 여부
- 이메일 인증 여부
- 마일리지 포인트
- 가입일
- 최근 예약일

필터:

- 전체
- 회원
- 비회원 예약자
- 관리자
- 연락처 미인증
- 이메일 미인증

관리자 액션:

- 회원 상세 보기
- 연락처/이메일/주소 수정
- 마일리지 수동 조정
- 운영 메모 남기기
- 계정 비활성화

주의사항:

- 예약 이력이 있는 회원은 물리 삭제하지 않고 비활성화합니다.
- 비회원 예약자는 예약 조회용 guest user로만 취급하고 로그인 권한을 만들지 않습니다.
- 회원 정보 변경은 `audit_logs`에 남깁니다.

## Pickup Rules Management

픽업 규칙은 "기본 가능 요일/시간"과 "예외 날짜/시간"을 분리합니다.

기본 규칙:

- 픽업 가능 요일
- 기본 픽업 시간대
- 하루 총 예약 가능 수량
- 예약 마감 기준
- 최소 준비일 계산 기준

예외 규칙:

- 예약 가능
- 마감
- 쉬는 날
- 숨김
- 픽업 시작/종료 시간
- 픽업 가능 시간대
- 주문 마감 시각
- 고객에게 보일 메모

예시:

```txt
기본: 매주 월/화/수/목/금 13:00, 15:00, 17:00 픽업 가능
예외: 2026-07-13 전체 불가
예외: 2026-07-20 15:00만 가능
```

고객 화면은 메뉴별 최소 준비일과 관리자 픽업 규칙을 함께 만족하는 날짜만 선택 가능하게 보여줍니다.

## Menu Management

메뉴 필드:

- 이름
- 카테고리
- 가격
- 설명
- 대표 이미지
- 시즌 메뉴 여부
- 최소 준비 시간
- 인당 최대 주문 가능 수량
- 전체 한정 수량
- 예약 가능 여부
- 노출 여부
- 정렬 순서

관리자 액션:

- 메뉴 추가
- 메뉴 수정
- 메뉴 삭제 또는 숨김
- 대표 이미지 업로드/R2 연결
- 품절 또는 예약 불가 처리
- 대표 메뉴 노출 설정

삭제 원칙:

- 예약 이력이 없는 메뉴는 삭제할 수 있습니다.
- 예약 이력이 있는 메뉴는 숨김 또는 예약 불가로 전환합니다.
- 예약 상세와 영수증에는 예약 당시 메뉴명/가격 snapshot을 계속 보여줍니다.

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
payment_pending -> payment_confirmed -> making -> pickup_ready -> picked_up
payment_pending/payment_confirmed -> cancelled
```

계좌이체 운영 흐름:

1. 고객이 예약을 제출하면 상태는 `payment_pending`입니다.
2. 고객은 안내받은 계좌로 입금합니다.
3. 관리자가 입금자명/금액을 확인합니다.
4. 관리자가 "입금 확인"을 누르면 예약은 `payment_confirmed`, 결제는 `payment_confirmed`가 됩니다.
5. 제작 시작 시 `making`, 포장 완료 시 `pickup_ready`, 수령 완료 시 `picked_up`으로 변경합니다.

예약 상세에서 보여줄 정보:

- 예약 번호
- 예약 유형: 회원/비회원
- 예약자 정보
- 픽업 날짜/시간
- 주문 메뉴와 수량
- 요청사항
- 결제/입금자 정보
- 상태 변경 타임라인
- 관리자 메모

관리자 액션:

- 입금 확인
- 제작중으로 변경
- 픽업대기로 변경
- 픽업완료로 변경
- 예약 취소
- 관리자 메모 저장

TereneHandover의 `OrdersTableDetail`처럼 상태 변경은 확인 모달과 처리 중 로딩을 둡니다. 단, 환불/정산/체크인/체크아웃처럼 숙박 도메인에만 필요한 버튼은 제외합니다.

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
- Admin ID/비밀번호로 로그인하면 고객 마이페이지가 아니라 관리자 페이지로 이동합니다.
- 관리자 mutation은 CSRF/중복 클릭 방지를 위해 서버 측 세션과 idempotency 전략을 함께 검토합니다.

## TereneHandover References

이번 범위에서 우선 참고할 파일:

```txt
../TereneHandover/terene-framer-frontend/Table/MemberPage/MemberInfoTable.tsx
../TereneHandover/terene-framer-frontend/Table/Members/MembersTableToolbar.tsx
../TereneHandover/terene-framer-frontend/Table/Orders/OrdersTableDetail.tsx
../TereneHandover/terene-framer-frontend/Table/Orders/OrdersTableDetailList.tsx
../TereneHandover/terene-framer-frontend/Table/AdminPage/AdminSettings.tsx
../TereneHandover/terene-framer-frontend/Table/AdminPage/SpecificDateRow.tsx
```

가져올 것:

- 테이블 검색/필터 구조
- 예약 상세 overlay 구조
- 상태 변경 전 확인 절차
- 처리 중 로딩과 중복 클릭 방지
- 설정 row를 읽기/수정 모드로 전환하는 패턴

버릴 것:

- 숙박 체크인/체크아웃 모델
- 객실/패키지/보증금/환불 정산 복잡도
- 법인회원/국적/등급 중심 필터
- Framer override 전용 구조
