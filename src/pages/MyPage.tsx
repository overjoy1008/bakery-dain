import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, ReceiptText, Save, UserRound } from "lucide-react";
import { apiRequest } from "../lib/api";
import { getAuthToken, logout, updateStoredUser, useAuthUser, type BakerySessionUser } from "../lib/auth";
import { SiteFooter } from "../sections/SiteFooter";

const priceFormatter = new Intl.NumberFormat("ko-KR", {
  currency: "KRW",
  maximumFractionDigits: 0,
  style: "currency",
});

const statusLabels: Record<string, string> = {
  cancelled: "취소",
  making: "제작중",
  payment_confirmed: "결제확인",
  payment_pending: "결제대기",
  picked_up: "픽업완료",
  pickup_ready: "픽업대기",
};

type UserDetail = {
  address: string;
  created_at?: string;
  email: string;
  id: string;
  is_email_verified?: number;
  is_phone_verified?: number;
  joined_at?: string | null;
  last_login_at?: string | null;
  mileage_points?: number;
  name: string;
  phone: string;
  site_username?: string;
  updated_at?: string;
  user_type?: string;
  username?: string;
};

type ReservationItem = {
  item_title_snapshot: string;
  line_total: number;
  quantity: number;
  unit_price_snapshot: number;
};

type UserReservation = {
  created_at: string;
  id: string;
  items: ReservationItem[];
  payment_status: string | null;
  pickup_date: string;
  pickup_time: string;
  reservation_number: string;
  status: string;
  total_payment_amount: number;
};

function normalizeUser(row: UserDetail): BakerySessionUser {
  return {
    address: row.address,
    email: row.email,
    id: row.id,
    name: row.name,
    phone: row.phone,
    userType: row.user_type === "admin" ? "admin" : "member",
    username: row.username ?? row.site_username ?? "",
  };
}

export function MyPage() {
  const navigate = useNavigate();
  const currentUser = useAuthUser();
  const [activeTab, setActiveTab] = useState<"info" | "reservations">("info");
  const [user, setUser] = useState<UserDetail | null>(null);
  const [reservations, setReservations] = useState<UserReservation[]>([]);
  const [selectedReservationId, setSelectedReservationId] = useState("");
  const [form, setForm] = useState({ address: "", email: "", name: "", phone: "" });
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const selectedReservation = useMemo(
    () => reservations.find((reservation) => reservation.id === selectedReservationId) ?? reservations[0],
    [reservations, selectedReservationId],
  );

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (currentUser.userType === "admin") {
      navigate("/admin");
      return;
    }

    let isMounted = true;
    const token = getAuthToken();

    Promise.all([
      apiRequest<{ user: UserDetail }>("/users/me", { token }),
      apiRequest<{ reservations: UserReservation[] }>("/users/me/reservations", { token }),
    ])
      .then(([userResponse, reservationResponse]) => {
        if (!isMounted) {
          return;
        }

        const nextUser = userResponse.user;
        setUser(nextUser);
        setForm({
          address: nextUser.address,
          email: nextUser.email,
          name: nextUser.name,
          phone: nextUser.phone,
        });
        setReservations(reservationResponse.reservations);
        setSelectedReservationId(reservationResponse.reservations[0]?.id ?? "");
        updateStoredUser(normalizeUser(nextUser));
      })
      .catch(() => {
        if (isMounted) {
          setErrorMessage("마이페이지 정보를 불러오지 못했어요. 다시 로그인해 주세요.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser, navigate]);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await apiRequest<{ user: UserDetail }>("/users/me", {
        body: form,
        method: "PATCH",
        token: getAuthToken(),
      });
      setUser(response.user);
      updateStoredUser(normalizeUser(response.user));
      setMessage("내 정보가 저장되었어요.");
    } catch {
      setErrorMessage("정보를 저장하지 못했어요. 입력값을 확인해 주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <section className="page-hero account-page-hero">
        <p className="eyebrow">my page</p>
        <h1>내 예약과 픽업 정보를 확인해요</h1>
        <p>예약자 정보가 맞는지 확인하고, 픽업 예정 주문의 상태를 한눈에 볼 수 있어요.</p>
      </section>

      <section className="account-workspace">
        <div className="account-tabs admin-tabs" role="tablist" aria-label="마이페이지">
          <button aria-pressed={activeTab === "info"} onClick={() => setActiveTab("info")} type="button">
            <UserRound size={17} />
            내 정보
          </button>
          <button
            aria-pressed={activeTab === "reservations"}
            onClick={() => setActiveTab("reservations")}
            type="button"
          >
            <ReceiptText size={17} />
            픽업 예약
          </button>
          <span className="admin-tabs-actions">
            <button
              className="admin-logout-button"
              onClick={() => {
                logout();
                navigate("/");
              }}
              type="button"
            >
              <LogOut size={17} />
              로그아웃
            </button>
          </span>
        </div>

        {isLoading ? (
          <p className="surface-message">마이페이지 정보를 불러오는 중이에요.</p>
        ) : (
          <>
            {errorMessage && <p className="form-error">{errorMessage}</p>}
            {message && <p className="form-success">{message}</p>}

            {activeTab === "info" && user && (
              <section className="account-panel">
                <div className="panel-heading">
                  <span>1</span>
                  <div>
                    <h2>내 정보</h2>
                    <p>예약 확인에 쓰이는 기본 정보를 관리해요.</p>
                  </div>
                </div>

                <dl className="account-info-grid">
                  <div>
                    <dt>사이트 아이디</dt>
                    <dd>{user.site_username ?? currentUser?.username}</dd>
                  </div>
                  <div>
                    <dt>마일리지</dt>
                    <dd>{(user.mileage_points ?? 0).toLocaleString()} P</dd>
                  </div>
                  <div>
                    <dt>연락처 인증</dt>
                    <dd>{user.is_phone_verified ? "완료" : "미인증"}</dd>
                  </div>
                  <div>
                    <dt>이메일 인증</dt>
                    <dd>{user.is_email_verified ? "완료" : "미인증"}</dd>
                  </div>
                </dl>

                <form className="auth-form" onSubmit={handleSave}>
                  <div className="form-grid">
                    <label className="form-field">
                      <span>이름</span>
                      <input
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                        required
                        value={form.name}
                      />
                    </label>
                    <label className="form-field">
                      <span>연락처</span>
                      <input
                        onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                        required
                        value={form.phone}
                      />
                    </label>
                  </div>
                  <label className="form-field">
                    <span>이메일</span>
                    <input
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                      required
                      type="email"
                      value={form.email}
                    />
                  </label>
                  <label className="form-field">
                    <span>주소</span>
                    <input
                      onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                      required
                      value={form.address}
                    />
                  </label>
                  <button className="submit-reservation" disabled={isSaving} type="submit">
                    <Save size={17} />
                    {isSaving ? "저장 중" : "내 정보 저장"}
                  </button>
                </form>
              </section>
            )}

            {activeTab === "reservations" && (
              <section className="account-panel">
                <div className="panel-heading">
                  <span>2</span>
                  <div>
                    <h2>픽업 예약</h2>
                    <p>계좌이체 확인 후 주문이 확정되면 상태가 바뀌어요.</p>
                  </div>
                </div>

                {reservations.length === 0 ? (
                  <div className="empty-state">
                    <strong>아직 픽업 예약이 없어요.</strong>
                    <span>메뉴를 담고 픽업일을 골라 첫 예약을 남겨보세요.</span>
                    <Link className="primary-action" to="/reserve">
                      예약하러 가기
                    </Link>
                  </div>
                ) : (
                  <div className="account-two-column">
                    <div className="reservation-list">
                      {reservations.map((reservation) => (
                        <button
                          aria-pressed={selectedReservation?.id === reservation.id}
                          key={reservation.id}
                          onClick={() => setSelectedReservationId(reservation.id)}
                          type="button"
                        >
                          <span>{reservation.reservation_number}</span>
                          <strong>
                            {reservation.pickup_date} {reservation.pickup_time}
                          </strong>
                          <small>{statusLabels[reservation.status] ?? reservation.status}</small>
                        </button>
                      ))}
                    </div>

                    {selectedReservation && (
                      <aside className="reservation-detail-panel">
                        <p className="eyebrow">receipt</p>
                        <h3>{selectedReservation.reservation_number}</h3>
                        <dl className="receipt-lines">
                          <div>
                            <dt>상태</dt>
                            <dd>{statusLabels[selectedReservation.status] ?? selectedReservation.status}</dd>
                          </div>
                          <div>
                            <dt>픽업</dt>
                            <dd>
                              {selectedReservation.pickup_date} {selectedReservation.pickup_time}
                            </dd>
                          </div>
                          <div>
                            <dt>결제</dt>
                            <dd>{statusLabels[selectedReservation.payment_status ?? ""] ?? "확인 전"}</dd>
                          </div>
                          <div>
                            <dt>합계</dt>
                            <dd>{priceFormatter.format(selectedReservation.total_payment_amount)}</dd>
                          </div>
                        </dl>
                        <div className="detail-item-list">
                          {selectedReservation.items.map((item) => (
                            <div key={`${selectedReservation.id}-${item.item_title_snapshot}`}>
                              <span>{item.item_title_snapshot}</span>
                              <strong>
                                {item.quantity}개 · {priceFormatter.format(item.line_total)}
                              </strong>
                            </div>
                          ))}
                        </div>
                      </aside>
                    )}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </section>

      <SiteFooter />
    </>
  );
}
