# UX Flows

## Customer Reservation Flow

```txt
Home
  -> 메뉴 보기
  -> 메뉴/수량 선택
  -> 픽업 가능일 선택
  -> 고객 정보 입력
  -> 예약 확인
  -> 예약 완료
```

## Menu-first Rationale

고객은 대부분 메뉴를 보고 예약 주문을 시작합니다. 다만 다닷네 베이커리는 날짜별로 받을 수 있는 메뉴와 수량이 달라질 수 있으므로, 메뉴 선택 이후 픽업 가능일과 수량을 서버 기준으로 다시 확인하는 흐름을 기본으로 합니다.

## Calendar States

| State | Meaning | Customer Action |
| --- | --- | --- |
| available | 예약 가능 | 선택 가능 |
| limited | 마감 임박 | 선택 가능, 남은 수량 강조 |
| closed | 예약 마감 | 선택 불가 |
| day_off | 쉬는 날 | 선택 불가 |
| hidden | 공개 전 | 표시하지 않음 또는 비활성 |

## Reservation Form Fields

- 픽업 날짜
- 픽업 시간
- 메뉴와 수량
- 고객 이름
- 연락처
- 요청사항
- 개인정보/예약 안내 동의

## Receipt Fields

- 예약 번호
- 예약 상태
- 고객 이름
- 픽업 날짜/시간
- 메뉴별 수량/가격
- 총 금액
- 요청사항
- 픽업 안내
- 변경/취소 안내

## Account Flow

```txt
Login
  -> 회원 로그인: My Page
  -> Admin 로그인: Admin Dashboard
  -> 비회원 예약: Reserve
```

## My Page Flow

```txt
My Page
  -> 내 정보 확인
  -> 내 정보 수정
  -> 픽업 예약 목록
  -> 예약 상세/영수증
```

회원 마이페이지는 "계정 관리"보다 "내 픽업 예약 확인"을 중심으로 설계합니다.

## Admin Flow

```txt
Admin Dashboard
  -> 입금 확인 대기 예약 확인
  -> 예약 상세
  -> 입금 확인
  -> 제작중
  -> 픽업대기
  -> 픽업완료
```

관리자 화면은 TereneHandover의 예약 상세 overlay와 상태 변경 확인 흐름을 참고하되, 베이커리 운영에 필요한 계좌이체 확인과 픽업 상태만 남깁니다.

## Empty and Error States

- 예약 가능한 날짜가 없을 때: "이번 주 예약은 아직 열리지 않았어요."
- 날짜는 열렸지만 메뉴가 없을 때: "이 날짜의 메뉴는 준비 중이에요."
- 제출 중 마감되었을 때: "방금 마감되었어요. 다른 날짜를 확인해 주세요."
- 관리자 저장 실패: 어떤 날짜/메뉴 저장이 실패했는지 표시합니다.
