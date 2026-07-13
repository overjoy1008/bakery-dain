# Slice 8. My Page and Admin Planning

## Goal

회원 고객은 자신의 정보와 픽업 예약을 확인하고, 관리자는 같은 로그인 흐름에서 Admin ID/비밀번호로 들어와 회원, 예약, 메뉴, 픽업 규칙을 운영할 수 있게 합니다.

이번 Slice는 바로 구현하기 전 화면/권한/API 기준을 정리하는 문서입니다.

## Route Map

```txt
/login
  -> member login success: /mypage
  -> admin login success: /admin
  -> guest reservation: /reserve?mode=guest

/mypage
  -> 내 정보 확인/수정
  -> 픽업 예약 조회
  -> 예약 상세/영수증

/admin
  -> Dashboard
  -> Reservations
  -> Members
  -> Menus
  -> Pickup Rules
  -> Settings
```

## Auth Split

로그인 UI는 고객과 관리자가 공유합니다. 서버가 로그인 응답에서 사용자 유형을 확정하고, 프론트는 그 값만 믿고 이동합니다.

```json
{
  "user": {
    "id": "usr_...",
    "userType": "member",
    "siteUsername": "dainlover",
    "name": "김다인"
  },
  "redirectTo": "/mypage"
}
```

Admin ID/비밀번호로 로그인한 경우:

```json
{
  "user": {
    "id": "usr_admin_owner",
    "userType": "admin",
    "siteUsername": "dainkim",
    "name": "다닷네 관리자"
  },
  "redirectTo": "/admin"
}
```

프론트에서 admin 여부를 아이디 문자열로 직접 판단하지 않습니다. 반드시 Worker API의 세션/me 응답을 기준으로 분기합니다.

## My Page

### Purpose

마이페이지는 쇼핑몰식 복잡한 계정 페이지가 아니라, "내 예약이 잘 접수됐는지"와 "픽업 정보가 맞는지"를 확인하는 곳입니다.

### Navigation

```txt
My Page
  - 내 정보
  - 픽업 예약
```

### My Info

표시/수정 필드:

- 사이트 아이디
- 이름
- 연락처
- 이메일
- 주소
- 연락처 인증 여부
- 이메일 인증 여부
- 마일리지 포인트
- 가입일

수정 가능:

- 이름
- 연락처
- 이메일
- 주소
- 비밀번호 변경

수정 불가:

- 고유 user id
- 사이트 아이디
- 가입일
- 인증 여부
- 마일리지 포인트

UX 원칙:

- TereneHandover의 `MemberInfoTable`처럼 섹션을 나누어 읽기 쉬운 정보표를 먼저 보여줍니다.
- "수정"을 누르면 수정 가능한 필드만 input으로 전환합니다.
- 저장 전에는 연락처/이메일/주소 누락을 막습니다.
- 비밀번호 변경은 별도 작은 form 또는 modal로 분리합니다.

### Pickup Reservations

예약 목록 컬럼:

- 예약 번호
- 픽업 날짜/시간
- 메뉴 요약
- 총 결제 금액
- 예약 상태
- 입금 상태
- 예약 생성일

필터:

- 전체
- 입금대기
- 주문확정
- 제작중
- 픽업대기
- 픽업완료
- 취소

예약 상세:

- 예약 번호
- 예약자 정보
- 픽업 날짜/시간
- 메뉴별 수량/가격
- 요청사항
- 입금 안내
- 상태 타임라인
- 픽업 안내 문구

비회원 예약은 마이페이지에 자동으로 묶이지 않습니다. 비회원은 예약 완료 화면 또는 예약번호/연락처 조회 기능으로 확인합니다. 회원 로그인 상태에서 만든 예약만 `/mypage` 목록에 안정적으로 연결합니다.

## Admin Page

### Purpose

관리자 페이지는 "작은 홈베이커리 운영자가 하루 주문을 확인하고 상태를 바꾸는 도구"입니다. 복잡한 쇼핑몰 CMS보다 빠른 확인과 실수 방지가 중요합니다.

### Dashboard

첫 화면 카드:

- 오늘 픽업
- 입금 확인 대기
- 제작중
- 이번 주 예상 매출
- 마감 임박 날짜

오늘 픽업 리스트:

- 픽업 시간
- 예약자
- 메뉴 요약
- 상태
- 상세 버튼

### Members

기능:

- 회원 조회
- 비회원 예약자 조회
- 이름/연락처/아이디 검색
- 회원 상세 보기
- 연락처/이메일/주소 수정
- 마일리지 수동 조정
- 운영 메모

TereneHandover 참고:

- `MembersTableToolbar`: 검색, 필터, reload 구조
- `MemberInfoTable`: 회원 상세 정보 섹션 구조

Bakery Dain에서는 개인/법인/국적/등급 중심 필터는 제외하고, 회원/비회원/관리자/미인증 정도만 사용합니다.

### Reservations

기능:

- 전체 픽업 예약 조회
- 날짜/상태/예약자 검색
- 예약 상세 보기
- 주문 상태 수정
- 입금자 정보 확인
- 관리자 메모

상태:

```txt
payment_pending: 결제대기
payment_confirmed: 결제확인
making: 제작중
pickup_ready: 픽업대기
picked_up: 픽업완료
cancelled: 취소
```

계좌이체 확정 흐름:

```txt
결제대기
  -> 관리자 입금 확인
  -> 결제확인
  -> 제작중
  -> 픽업대기
  -> 픽업완료
```

TereneHandover 참고:

- `OrdersTableDetail`: 예약 상세 overlay, 확인 modal, 처리 중 로딩
- `OrdersTableDetailList`: 예약자/예약 정보/상태 타임라인 표시

Bakery Dain에서는 환불 정산, 체크인/체크아웃, 보증금, 패키지 정산은 제외합니다.

### Menus

기능:

- 메뉴 추가
- 메뉴 수정
- 메뉴 삭제 또는 숨김
- 대표 사진 업로드
- 카테고리 지정
- 시즌 여부 설정
- 가격 설정
- 최소 준비 시간 설정
- 인당 최대 주문 개수 설정
- 전체 한정수량 설정
- 예약 가능/불가능 전환

삭제 정책:

- 예약 이력이 없으면 삭제 가능
- 예약 이력이 있으면 숨김 또는 예약 불가 처리
- 기존 예약 영수증은 snapshot을 유지

### Pickup Rules

기능:

- 기본 픽업 가능 요일 설정
- 기본 픽업 시간대 설정
- 특정 날짜 전체 불가 설정
- 특정 날짜 시간대만 불가 설정
- 특정 날짜 커스텀 시간대 설정
- 고객에게 보일 안내 메모 설정

규칙 예시:

```txt
기본 픽업 가능: 월, 화, 수, 목, 금
기본 시간대: 13:00, 15:00, 17:00
예외: 2026-07-13 전체 불가
예외: 2026-07-20 15:00만 가능
```

픽업 가능일 계산:

```txt
KST 기준 내일부터 시작
+ 메뉴별 최소 준비 시간 충족
+ 관리자 기본 가능 요일 충족
+ 관리자 예외 날짜/시간 미해당
+ 메뉴 예약 가능 상태
+ 한정수량 남음
```

### Settings

초기에는 운영에 직접 필요한 설정만 둡니다.

- 상단 흐르는 공지 문구
- 입금 계좌 안내 문구
- 픽업 안내 문구
- 예약/취소 안내 문구
- 대표 메뉴 노출 설정
- R2 사용량 확인 링크 또는 요약

## API Needs

고객:

```txt
GET   /api/auth/me
PATCH /api/users/me
GET   /api/users/me/reservations
GET   /api/users/me/reservations/:id
```

관리자:

```txt
GET   /api/admin/dashboard
GET   /api/admin/users
GET   /api/admin/users/:id
PATCH /api/admin/users/:id

GET   /api/admin/reservations
GET   /api/admin/reservations/:id
PATCH /api/admin/reservations/:id/status
PATCH /api/admin/reservations/:id/admin-note

GET    /api/admin/menus
POST   /api/admin/menus
PATCH  /api/admin/menus/:id
DELETE /api/admin/menus/:id

GET   /api/admin/pickup-rules
PUT   /api/admin/pickup-rules
GET   /api/admin/pickup-exceptions
POST  /api/admin/pickup-exceptions
PATCH /api/admin/pickup-exceptions/:id
DELETE /api/admin/pickup-exceptions/:id
```

## Build Order

1. `/mypage` shell: 내 정보/예약 탭과 empty state
2. `GET /api/auth/me` 기반 회원/admin redirect 정리
3. 내 정보 조회/수정 API 연결
4. 내 예약 목록/상세 연결
5. `/admin` shell: dashboard/reservations/members/menus/rules 탭
6. 관리자 예약 목록/상세와 상태 변경 연결
7. 회원 조회/상세 연결
8. 메뉴 CRUD와 R2 이미지 업로드 연결
9. 픽업 규칙 CRUD 연결

## Acceptance Criteria

- 회원 로그인 후 `/mypage`에서 내 정보와 예약 목록을 볼 수 있습니다.
- 회원은 이름, 연락처, 이메일, 주소를 수정할 수 있습니다.
- Admin ID/비밀번호로 로그인하면 `/admin`으로 이동합니다.
- 관리자는 전체 예약을 보고 입금 확인으로 주문을 확정할 수 있습니다.
- 관리자는 예약 상태를 제작중, 픽업대기, 픽업완료로 변경할 수 있습니다.
- 관리자는 회원을 검색하고 상세 정보를 확인할 수 있습니다.
- 관리자는 메뉴를 추가/수정/삭제 또는 숨김 처리할 수 있습니다.
- 관리자는 기본 픽업 요일/시간과 예외 날짜/시간을 설정할 수 있습니다.
- 모든 관리자 변경은 서버 인증을 통과하고 audit log 대상으로 남길 수 있게 설계됩니다.
