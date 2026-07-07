import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronDown, Minus, Plus, ReceiptText, ShoppingCart, UserRound } from "lucide-react";
import { menuItems } from "../data/brandShell";
import { adminPickupRule, pickupDays } from "../data/reservation";
import { useAuthUser } from "../lib/auth";
import { SiteFooter } from "../sections/SiteFooter";

const priceFormatter = new Intl.NumberFormat("ko-KR", {
  currency: "KRW",
  maximumFractionDigits: 0,
  style: "currency",
});

type ReservationType = "guest" | "member";
type SelectedMenus = Record<string, number>;

function getSelectedMenuIds(selectedMenus: SelectedMenus) {
  return Object.entries(selectedMenus)
    .filter(([, quantity]) => quantity > 0)
    .map(([menuId]) => menuId);
}

function getDaysFromBase(dateString: string) {
  const baseTime = new Date(`${adminPickupRule.baseDate}T00:00:00`).getTime();
  const targetTime = new Date(`${dateString}T00:00:00`).getTime();
  return Math.round((targetTime - baseTime) / 86_400_000);
}

export function ReservationPage() {
  const [searchParams] = useSearchParams();
  const currentUser = useAuthUser();
  const initialMenuId = searchParams.get("menu");
  const hasInitialMenu = menuItems.some((item) => item.id === initialMenuId);
  const [selectedMenus, setSelectedMenus] = useState<SelectedMenus>(
    hasInitialMenu && initialMenuId ? { [initialMenuId]: 1 } : {},
  );
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [memo, setMemo] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reservationType: ReservationType = currentUser ? "member" : "guest";
  const selectedMenuIds = useMemo(() => getSelectedMenuIds(selectedMenus), [selectedMenus]);
  const selectedMenuItems = menuItems.filter((item) => selectedMenuIds.includes(item.id));
  const requiredPrepDays = selectedMenuItems.reduce(
    (maxPrepDays, item) => Math.max(maxPrepDays, item.prepDays),
    0,
  );

  const availableDays = useMemo(
    () =>
      pickupDays.filter(
        (day) =>
          day.status !== "day_off" &&
          selectedMenuIds.length > 0 &&
          getDaysFromBase(day.date) >= requiredPrepDays,
      ),
    [requiredPrepDays, selectedMenuIds.length],
  );

  useEffect(() => {
    if (selectedMenuIds.length === 0) {
      setSelectedDate("");
      setSelectedTime("");
      return;
    }

    const stillAvailable = availableDays.some((day) => day.date === selectedDate);
    if (!stillAvailable) {
      setSelectedDate(availableDays[0]?.date ?? "");
      setSelectedTime(availableDays[0]?.timeSlots[0] ?? "");
    }
  }, [availableDays, selectedDate, selectedMenuIds.length]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    setCustomerName(currentUser.name);
    setCustomerPhone(currentUser.phone);
    setCustomerEmail(currentUser.email);
    setCustomerAddress(currentUser.address);
  }, [currentUser]);

  const selectedDay = pickupDays.find((day) => day.date === selectedDate);
  const subtotal = selectedMenuItems.reduce(
    (total, item) => total + item.price * (selectedMenus[item.id] ?? 0),
    0,
  );
  const selectedTotalQuantity = selectedMenuItems.reduce(
    (total, item) => total + (selectedMenus[item.id] ?? 0),
    0,
  );
  const isReady = Boolean(
    selectedDate &&
      selectedTime &&
      selectedMenuItems.length > 0 &&
      customerName &&
      customerPhone &&
      customerEmail &&
      customerAddress &&
      agreed,
  );

  const reservationNumber = `BD-${selectedDate.replaceAll("-", "").slice(2)}-0001`;

  const updateMenuQuantity = (menuId: string, nextQuantity: number) => {
    setSelectedMenus((currentMenus) => {
      const normalizedQuantity = Math.max(0, Math.min(6, nextQuantity));
      const nextMenus = { ...currentMenus };

      if (normalizedQuantity === 0) {
        delete nextMenus[menuId];
      } else {
        nextMenus[menuId] = normalizedQuantity;
      }

      return nextMenus;
    });
    setSubmitted(false);
  };

  return (
    <>
      <section className="page-hero reservation-page-hero">
        <p className="eyebrow">preorder</p>
        <h1>먹고 싶은 메뉴를 담고 픽업일을 골라요</h1>
        <p>
          여러 메뉴를 함께 예약할 수 있어요. 선택한 메뉴를 모두 준비할 수 있는 날짜와
          운영자가 픽업을 도와드릴 수 있는 시간만 예약 가능일로 보여드립니다.
        </p>
      </section>

      <section className="reservation-workspace">
        <div className="reservation-flow">
          <section className="reservation-panel">
            <div className="panel-heading">
              <span>1</span>
              <div>
                <h2>{currentUser ? "회원 예약 정보" : "예약자 정보"}</h2>
                <p>
                  {currentUser
                    ? "로그인한 회원 정보로 예약 확인 안내를 보내드릴게요."
                    : "예약 확인과 픽업 안내를 받을 정보를 먼저 남겨주세요."}
                </p>
              </div>
            </div>

            {currentUser ? (
              <dl className="member-summary">
                <div>
                  <dt>아이디</dt>
                  <dd>{currentUser.username}</dd>
                </div>
                <div>
                  <dt>이름</dt>
                  <dd>{currentUser.name}</dd>
                </div>
                <div>
                  <dt>연락처</dt>
                  <dd>{currentUser.phone}</dd>
                </div>
                <div>
                  <dt>이메일</dt>
                  <dd>{currentUser.email}</dd>
                </div>
                <div>
                  <dt>주소</dt>
                  <dd>{currentUser.address}</dd>
                </div>
              </dl>
            ) : (
              <>
                <div className="form-grid">
                  <label className="form-field">
                    <span>이름</span>
                    <input
                      autoComplete="name"
                      onChange={(event) => setCustomerName(event.target.value)}
                      placeholder="예약자 이름"
                      required
                      value={customerName}
                    />
                  </label>
                  <label className="form-field">
                    <span>연락처</span>
                    <input
                      autoComplete="tel"
                      inputMode="tel"
                      onChange={(event) => setCustomerPhone(event.target.value)}
                      placeholder="010-0000-0000"
                      required
                      value={customerPhone}
                    />
                  </label>
                </div>

                <div className="form-grid">
                  <label className="form-field">
                    <span>이메일</span>
                    <input
                      autoComplete="email"
                      onChange={(event) => setCustomerEmail(event.target.value)}
                      placeholder="bakery@example.com"
                      required
                      type="email"
                      value={customerEmail}
                    />
                  </label>
                  <label className="form-field">
                    <span>주소</span>
                    <input
                      autoComplete="street-address"
                      onChange={(event) => setCustomerAddress(event.target.value)}
                      placeholder="예약 확인에 필요한 주소"
                      required
                      value={customerAddress}
                    />
                  </label>
                </div>

                <Link className="reservation-login-link" to="/login">
                  회원이면 로그인 후 더 빠르게 예약할 수 있어요.
                </Link>
              </>
            )}
          </section>

          <section className="reservation-panel">
            <div className="panel-heading">
              <span>2</span>
              <div>
                <h2>메뉴 담기</h2>
                <p>메뉴별 최소 준비 시간을 확인하고 함께 예약할 메뉴를 담아주세요.</p>
              </div>
            </div>

            <div className="reservation-menu-list">
              {menuItems.map((item) => {
                const quantity = selectedMenus[item.id] ?? 0;
                return (
                  <article
                    className="reservation-menu-option"
                    data-selected={quantity > 0}
                    key={item.id}
                  >
                    <img src={item.image} alt="" />
                    <span>
                      <strong>{item.name}</strong>
                      <small>
                        {priceFormatter.format(item.price)} · 최소 준비 시간: {item.prepDays}일
                      </small>
                    </span>
                    {quantity > 0 ? (
                      <div className="menu-card-stepper" aria-label={`${item.name} 수량 선택`}>
                        <button
                          aria-label={`${item.name} 수량 줄이기`}
                          onClick={() => updateMenuQuantity(item.id, quantity - 1)}
                          type="button"
                        >
                          <Minus size={14} />
                        </button>
                        <strong>{quantity}</strong>
                        <button
                          aria-label={`${item.name} 수량 늘리기`}
                          onClick={() => updateMenuQuantity(item.id, quantity + 1)}
                          type="button"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        aria-label={`${item.name} 담기`}
                        className="cart-add-button"
                        onClick={() => updateMenuQuantity(item.id, 1)}
                        type="button"
                      >
                        <ShoppingCart size={17} strokeWidth={1.9} />
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="reservation-panel" id="pickup">
            <div className="panel-heading">
              <span>3</span>
              <div>
                <h2>픽업 가능일</h2>
                <p>운영 가능 요일과 선택 메뉴의 최소 준비 시간을 함께 반영해요.</p>
              </div>
            </div>

            <div className="calendar-widget" aria-label="예약 가능일 캘린더">
              {pickupDays.map((day) => {
                const needsMorePrep = getDaysFromBase(day.date) < requiredPrepDays;
                const isDisabled =
                  day.status === "day_off" ||
                  needsMorePrep ||
                  selectedMenuIds.length === 0;
                const statusLabel =
                  selectedMenuIds.length === 0
                    ? "메뉴 선택 필요"
                    : needsMorePrep
                      ? "준비일 부족"
                      : day.statusLabel;

                return (
                  <button
                    aria-pressed={selectedDate === day.date}
                    className={`calendar-day calendar-day-${day.status}`}
                    disabled={isDisabled}
                    key={day.date}
                    onClick={() => {
                      setSelectedDate(day.date);
                      setSelectedTime(day.timeSlots[0] ?? "");
                      setSubmitted(false);
                    }}
                    type="button"
                  >
                    <span>{day.dayLabel}</span>
                    <strong>{day.dateLabel}</strong>
                    <small>{statusLabel}</small>
                  </button>
                );
              })}
            </div>

            <div className="time-widget" aria-label="픽업 시간">
              {(selectedDay?.timeSlots ?? []).map((time) => (
                <button
                  aria-pressed={selectedTime === time}
                  className="time-chip"
                  key={time}
                  onClick={() => {
                    setSelectedTime(time);
                    setSubmitted(false);
                  }}
                  type="button"
                >
                  {time}
                </button>
              ))}
            </div>
          </section>

          <section className="reservation-panel">
            <div className="panel-heading">
              <span>4</span>
              <div>
                <h2>요청사항 확인</h2>
                <p>선물 포장, 픽업 메모처럼 미리 알려주실 내용을 남겨주세요.</p>
              </div>
            </div>

            <label className="form-field">
              <span>요청사항</span>
              <textarea
                onChange={(event) => setMemo(event.target.value)}
                placeholder="선물 포장, 픽업 메모 등을 남겨주세요."
                value={memo}
              />
            </label>

            <label className="agreement-row">
              <input
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
                type="checkbox"
              />
              <span>예약 내용과 픽업 안내를 확인했어요.</span>
            </label>
          </section>
        </div>

        <aside className="receipt-widget" aria-label="예약 영수증">
          <div className="receipt-heading">
            <ReceiptText size={22} strokeWidth={1.8} />
            <span>예약 영수증</span>
          </div>

          {selectedMenuItems.length > 0 ? (
            <div className="receipt-product-list">
              {selectedMenuItems.map((item) => {
              const quantity = selectedMenus[item.id] ?? 0;
              const maxQuantity = Math.max(1, Math.min(6, selectedDay?.dailyCapacity ?? 6));

              return (
                <div className="receipt-product" key={item.id}>
                  <img src={item.image} alt="" />
                  <div>
                    <strong>{item.name}</strong>
                    <span>
                      {priceFormatter.format(item.price)} · 최소 준비 시간: {item.prepDays}일
                    </span>
                    <div className="line-quantity-stepper" aria-label={`${item.name} 수량 선택`}>
                      <button
                        aria-label={`${item.name} 수량 줄이기`}
                        onClick={() => updateMenuQuantity(item.id, quantity - 1)}
                        type="button"
                      >
                        <Minus size={14} />
                      </button>
                      <span>{quantity}</span>
                      <button
                        aria-label={`${item.name} 수량 늘리기`}
                        disabled={quantity >= maxQuantity}
                        onClick={() => updateMenuQuantity(item.id, quantity + 1)}
                        type="button"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          ) : (
            <div className="receipt-empty">
              <strong>담긴 메뉴가 없어요.</strong>
              <span>왼쪽 메뉴에서 장바구니 아이콘을 눌러 예약할 메뉴를 담아주세요.</span>
            </div>
          )}

          <dl className="receipt-lines">
            <div>
              <dt>예약 유형</dt>
              <dd>{reservationType === "member" ? "회원 예약" : "비회원 예약"}</dd>
            </div>
            <div>
              <dt>담은 메뉴</dt>
              <dd>{selectedMenuItems.length}종 / {selectedTotalQuantity}개</dd>
            </div>
            <div>
              <dt>최소 준비 시간</dt>
              <dd>{requiredPrepDays > 0 ? `${requiredPrepDays}일` : "메뉴 선택 전"}</dd>
            </div>
            <div>
              <dt>픽업일</dt>
              <dd>{selectedDay ? `${selectedDay.dateLabel} ${selectedDay.dayLabel}` : "선택 전"}</dd>
            </div>
            <div>
              <dt>픽업 시간</dt>
              <dd>{selectedTime || "선택 전"}</dd>
            </div>
            <div>
              <dt>합계</dt>
              <dd>{priceFormatter.format(subtotal)}</dd>
            </div>
          </dl>

          <button
            className="submit-reservation"
            disabled={!isReady}
            onClick={() => setSubmitted(true)}
            type="button"
          >
            <UserRound size={17} strokeWidth={1.9} />
            예약 내용 확인
          </button>

          {submitted && (
            <div className="reservation-result">
              <strong>{reservationNumber}</strong>
              <span>예약 신청이 접수되었어요. 확인 후 안내드릴게요.</span>
            </div>
          )}

          <Link className="receipt-link" to="/menu">
            다른 메뉴 보기
            <ChevronDown size={16} strokeWidth={1.9} />
          </Link>
        </aside>
      </section>

      <SiteFooter />
    </>
  );
}
