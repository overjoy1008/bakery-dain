# KPI Plan

## North Star Metric

**예약 완료 수 대비 운영자가 수동으로 다시 확인해야 하는 주문 비율 감소**

단순 방문자 수보다 실제 운영 부담을 줄이는 것이 이 프로젝트의 핵심입니다.

## Primary KPIs

| KPI | Definition | Target for MVP |
| --- | --- | --- |
| 예약 완료율 | 예약 시작 세션 중 예약 제출 완료 비율 | 35% 이상 |
| 예약 오류율 | 잘못된 날짜, 품절 메뉴, 누락 연락처 등 운영자 수정이 필요한 예약 비율 | 5% 이하 |
| 관리자 설정 소요 시간 | 한 주 예약 가능일/메뉴 세팅에 걸리는 시간 | 10분 이하 |
| 주문 확인 문의 감소 | DM으로 다시 확인해야 하는 주문 건수 | 기존 대비 50% 감소 |
| 픽업 정보 확인률 | 완료 화면 또는 알림에서 픽업 안내를 확인한 예약 비율 | 80% 이상 |

## Secondary KPIs

- 메뉴 카드 클릭률
- 예약 가능일 클릭률
- 예약 폼 이탈률
- 인기 메뉴별 예약 수량
- 날짜별 예약 마감 속도
- 평균 주문 금액
- 선물 포장 선택률
- 인스타그램 링크 클릭률

## Admin KPIs

- 오늘/이번 주 예약 건수
- 오늘/이번 주 예상 매출
- 미확인 예약 수
- 픽업 완료 처리율

## Measurement Events

```txt
home_viewed
menu_card_clicked
calendar_date_selected
reservation_started
reservation_item_added
reservation_submitted
reservation_completed
admin_logged_in
admin_availability_updated
admin_menu_updated
admin_order_status_updated
```

## Analytics Principle

개인정보를 과하게 수집하지 않습니다. 고객 식별보다 예약 흐름 개선과 운영 효율 측정에 필요한 이벤트만 기록합니다.
