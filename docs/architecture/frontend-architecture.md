# Frontend Architecture

## Goals

- 고객 예약 흐름을 모바일에서 빠르고 명확하게 제공합니다.
- 관리자 화면은 반복 업무를 빠르게 처리할 수 있게 구성합니다.
- TereneHandover의 캘린더/영수증/관리자 UI 경험을 참고하되, Framer override 구조는 가져오지 않습니다.

## Proposed Structure

```txt
src/
  main.tsx
  app/
    App.tsx
    router.tsx
    providers.tsx
  pages/
    HomePage.tsx
    MenuPage.tsx
    ReservationPage.tsx
    ReceiptPage.tsx
    AdminLoginPage.tsx
    AdminDashboardPage.tsx
  sections/
    hero/
    notice-bar/
    weekly-menu/
    calendar-preview/
    how-to-order/
    instagram-preview/
  components/
    ui/
    layout/
    calendar/
    menu/
    form/
  features/
    reservation/
    menu/
    admin/
    receipt/
    auth/
  hooks/
  lib/
  data/
  styles/
```

## Feature Modules

- `features/reservation`: date selection, menu selection, customer form, submit logic, summary
- `features/menu`: menu list, category filter, menu card, availability badges
- `features/admin`: dashboard, availability editor, menu editor, reservation table
- `features/receipt`: receipt summary, pickup instructions, reservation status
- `features/auth`: admin login, auth state, protected API client

## State Management

MVP에서는 React state와 custom hooks를 우선합니다. 전역 상태가 필요해지면 가볍게 `zustand`를 검토합니다. 예약 단계의 상태는 URL 또는 session storage 복구 전략을 고려하되, 서버 확정 전에는 임시 상태로 취급합니다.

## UI Components

- Button
- IconButton
- Input
- Textarea
- Select
- Checkbox
- Badge
- Modal
- CalendarDay
- MenuCard
- QuantityStepper
- StatusTabs
- AdminTable
- EmptyState
- LoadingState

## Accessibility

- 모든 버튼은 명확한 accessible name을 가집니다.
- 캘린더 날짜는 상태가 스크린리더에도 전달되어야 합니다.
- 색상만으로 가능/마감/휴무를 구분하지 않습니다.
- 예약 폼 오류는 필드 근처에 표시합니다.
