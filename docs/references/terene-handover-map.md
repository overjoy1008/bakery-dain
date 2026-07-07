# TereneHandover Reference Map

## Purpose

`../TereneHandover`는 숙박 예약 외주 웹사이트의 인수인계 코드입니다. Bakery Dain에서는 기능 아이디어와 검증된 UI/API 패턴을 참고하되, 도메인과 규모에 맞게 단순화합니다.

## Useful Frontend References

### Calendar

```txt
../TereneHandover/terene-framer-frontend/Calendar/
../TereneHandover/terene-framer-frontend/Store/CalendarStore.tsx
../TereneHandover/terene-framer-frontend/Utils/DateUtils.tsx
../TereneHandover/terene-framer-frontend/Utils/KST.tsx
```

Use for:

- 날짜 선택 UX
- 월/주 단위 표시
- 휴무/예약 가능 상태 표현
- KST 날짜 처리 아이디어

Adaptation:

- 숙박의 체크인/체크아웃 범위 선택을 베이커리 픽업 날짜 단일 선택으로 줄입니다.
- 객실 가능 여부 대신 날짜별 메뉴 가능 여부를 표시합니다.

### Receipt

```txt
../TereneHandover/terene-framer-frontend/Receipt/
```

Use for:

- 예약 정보 요약
- 금액 표시
- 약관 동의
- 제출/로딩/완료 흐름

Adaptation:

- 숙박 영수증을 메뉴/수량/픽업일 중심의 프리오더 확인서로 바꿉니다.
- 할인/쿠폰/멤버십은 MVP에서 제외합니다.

### Admin Tables

```txt
../TereneHandover/terene-framer-frontend/Table/
../TereneHandover/terene-framer-frontend/Table/AdminPage/
../TereneHandover/terene-framer-frontend/Table/Orders/
```

Use for:

- 관리자 테이블 구조
- 상태 badge
- 예약 상세 overlay
- 날짜별 설정 UI

Adaptation:

- 숙박의 회원/쿠폰/마일리지 탭은 제외합니다.
- 날짜/메뉴/예약 상태 중심으로 단순화합니다.

### Auth

```txt
../TereneHandover/terene-framer-frontend/Auth/
../TereneHandover/terene-notifier-server/routes/auth.js
```

Use for:

- 관리자 접근 제어 흐름
- 비밀번호 확인 UX

Adaptation:

- Bakery Dain은 단일 owner admin 중심으로 시작합니다.
- 모든 관리자 mutation은 Worker API 인증을 요구합니다.

## Useful Backend References

### DB Server

```txt
../TereneHandover/terene-db-server/src/
../TereneHandover/terene-db-server/instances/patch_250928/
../TereneHandover/terene-db-server/instances/orders_250618/
```

Use for:

- 예약/관리자 설정 도메인 분리
- calendar/admin schema 아이디어
- service/controller/route 계층 분리

Adaptation:

- Express/PostgreSQL 구조를 Cloudflare Workers/Hono/D1 구조로 변환합니다.
- 숙박의 membership, coupon, refund policy는 MVP에서 제외합니다.

### Notifier Server

```txt
../TereneHandover/terene-notifier-server/
```

Use for:

- 예약 후속 처리
- 메시지 템플릿
- queue 기반 처리
- 알림 발송 경계

Adaptation:

- MVP에서는 알림 서버를 별도로 만들지 않습니다.
- 예약 안정화 후 관리자/고객 알림을 Worker route 또는 별도 queue로 확장합니다.

### Toss Server

```txt
../TereneHandover/terene-toss-server-api/
```

Use for:

- 향후 결제 승인 검증 참고

Adaptation:

- MVP에서는 결제 미연동.
- 결제 도입 시 서버 confirm 원칙만 참고합니다.

## What Not to Copy Directly

- Framer-specific override 구조
- 숙박 도메인의 객실/체크인/체크아웃 모델
- 쿠폰/마일리지/멤버십 복잡도
- Render/Express 운영 구조
- 대형 예약 서비스 수준의 관리자 기능

## Migration Mindset

TereneHandover는 "검증된 예약 서비스의 참고서"이고 Bakery Dain은 "작은 베이커리 운영에 맞춘 새 제품"입니다. 이름만 바꾸는 포팅이 아니라, 도메인 중심으로 다시 설계합니다.
