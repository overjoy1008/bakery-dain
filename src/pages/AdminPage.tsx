import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ClipboardList,
  ImagePlus,
  LogOut,
  PackagePlus,
  RefreshCw,
  Save,
  X,
  UsersRound,
} from "lucide-react";
import { CheckControl } from "../components/CheckControl";
import { API_BASE_URL, apiRequest } from "../lib/api";
import { getAuthToken, logout, useAuthUser } from "../lib/auth";
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

const weekdays = [
  { label: "일", value: 0 },
  { label: "월", value: 1 },
  { label: "화", value: 2 },
  { label: "수", value: 3 },
  { label: "목", value: 4 },
  { label: "금", value: 5 },
  { label: "토", value: 6 },
];

type AdminTab = "dashboard" | "reservations" | "members" | "menus" | "rules";

type Dashboard = {
  pendingCount: number;
  popularItems: Array<{ quantity: number; title: string }>;
  today: string;
  todayCount: number;
  todayPickups: Array<AdminReservation>;
  weekCount: number;
  weekRevenue: number;
};

type AdminReservation = {
  admin_note?: string | null;
  created_at: string;
  email?: string;
  id: string;
  items?: Array<{
    item_title_snapshot: string;
    line_total: number;
    quantity: number;
    unit_price_snapshot: number;
  }>;
  name: string;
  payer_name?: string | null;
  payment_status?: string | null;
  phone: string;
  pickup_date: string;
  pickup_time: string;
  reservation_number: string;
  reservation_type?: string;
  status: string;
  total_payment_amount: number;
  user_id?: string;
};

type AdminUser = {
  address: string;
  created_at: string;
  email: string;
  id: string;
  is_email_verified: number;
  is_phone_verified: number;
  joined_at: string | null;
  last_login_at: string | null;
  mileage_points: number;
  name: string;
  phone: string;
  site_username: string | null;
  user_type: string;
};

type AdminItem = {
  category_id: string;
  category_name: string;
  description: string;
  id: string;
  image_key: string | null;
  image_url: string | null;
  is_reservable: number;
  is_seasonal: number;
  max_per_person: number;
  min_prep_days: number;
  price: number;
  remaining_limited_quantity: number | null;
  slug: string;
  sort_order: number;
  title: string;
  total_limited_quantity: number | null;
};

type Category = {
  id: string;
  label?: string;
  name?: string;
};

type PickupRule = {
  available_weekdays_json: string;
  daily_capacity: number | null;
  default_time_slots_json: string;
  id: string;
};

type PickupException = {
  date: string;
  exception_type: "unavailable" | "custom_hours";
  id: string;
  reason: string | null;
  time_slots_json: string | null;
};

const emptyMenuForm = {
  categoryId: "cat_tart",
  description: "",
  imageKey: "",
  imageUrl: "",
  isReservable: true,
  isSeasonal: false,
  maxPerPerson: 4,
  minPrepDays: 3,
  price: 0,
  remainingLimitedQuantity: "",
  slug: "",
  sortOrder: 100,
  title: "",
  totalLimitedQuantity: "",
};

function createMenuForm(item: AdminItem) {
  return {
    categoryId: item.category_id,
    description: item.description,
    imageKey: item.image_key ?? "",
    imageUrl: item.image_url ?? "",
    isReservable: Boolean(item.is_reservable),
    isSeasonal: Boolean(item.is_seasonal),
    maxPerPerson: item.max_per_person,
    minPrepDays: item.min_prep_days,
    price: item.price,
    remainingLimitedQuantity: item.remaining_limited_quantity?.toString() ?? "",
    slug: item.slug,
    sortOrder: item.sort_order,
    title: item.title,
    totalLimitedQuantity: item.total_limited_quantity?.toString() ?? "",
  };
}

type UploadedMedia = {
  media: {
    key: string;
    publicPath: string;
  };
};

function parseJsonList<T>(value: string | null | undefined, fallback: T[]) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T[];
  } catch {
    return fallback;
  }
}

function normalizeAdminImageUrl(imageUrl: string | null) {
  if (!imageUrl) {
    return "";
  }

  if (imageUrl.startsWith("/api/")) {
    return `${API_BASE_URL.replace(/\/api$/, "")}${imageUrl}`;
  }

  return imageUrl;
}

function createImagePreview(file: File) {
  return URL.createObjectURL(file);
}

async function resizeImageFile(file: File, scale: number) {
  const image = new Image();
  const objectUrl = createImagePreview(file);

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("이미지를 읽지 못했어요."));
      image.src = objectUrl;
    });

    const outputSize = 1200;
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("이미지를 처리하지 못했어요.");
    }

    context.fillStyle = "#fff8ed";
    context.fillRect(0, 0, outputSize, outputSize);

    const coverRatio = Math.max(outputSize / image.width, outputSize / image.height);
    const ratio = coverRatio * scale;
    const drawWidth = image.width * ratio;
    const drawHeight = image.height * ratio;
    const drawX = (outputSize - drawWidth) / 2;
    const drawY = (outputSize - drawHeight) / 2;
    context.drawImage(image, drawX, drawY, drawWidth, drawHeight);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((nextBlob) => {
        if (nextBlob) {
          resolve(nextBlob);
        } else {
          reject(new Error("이미지를 저장하지 못했어요."));
        }
      }, "image/webp", 0.9);
    });

    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", {
      type: "image/webp",
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function AdminPage() {
  const navigate = useNavigate();
  const currentUser = useAuthUser();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [items, setItems] = useState<AdminItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pickupRule, setPickupRule] = useState<PickupRule | null>(null);
  const [pickupExceptions, setPickupExceptions] = useState<PickupException[]>([]);
  const [selectedReservationId, setSelectedReservationId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [editingMenuId, setEditingMenuId] = useState("");
  const [menuForm, setMenuForm] = useState(emptyMenuForm);
  const [ruleForm, setRuleForm] = useState({
    availableWeekdays: [1, 2, 3, 4, 5],
    dailyCapacity: 18,
    timeSlots: "14:00,16:00,18:00",
  });
  const [exceptionForm, setExceptionForm] = useState({
    date: "",
    exceptionType: "unavailable" as "unavailable" | "custom_hours",
    reason: "",
    timeSlots: "14:00,16:00,18:00",
  });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imageScale, setImageScale] = useState(1);
  const [isImageUploading, setIsImageUploading] = useState(false);

  const token = getAuthToken();
  const selectedReservation = useMemo(
    () => reservations.find((reservation) => reservation.id === selectedReservationId) ?? reservations[0],
    [reservations, selectedReservationId],
  );
  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? users[0],
    [users, selectedUserId],
  );

  const loadAdminData = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [
        dashboardResponse,
        reservationResponse,
        userResponse,
        menuResponse,
        publicMenuResponse,
        pickupResponse,
      ] = await Promise.all([
        apiRequest<{ dashboard: Dashboard }>("/admin/dashboard", { token }),
        apiRequest<{ reservations: AdminReservation[] }>("/admin/reservations", { token }),
        apiRequest<{ users: AdminUser[] }>("/admin/users", { token }),
        apiRequest<{ items: AdminItem[] }>("/admin/menus", { token }),
        apiRequest<{ categories: Array<{ id: string; name: string }> }>("/public/menus"),
        apiRequest<{ exceptions: PickupException[]; rule: PickupRule }>("/admin/pickup-rules", { token }),
      ]);

      setDashboard(dashboardResponse.dashboard);
      setReservations(reservationResponse.reservations);
      setSelectedReservationId(reservationResponse.reservations[0]?.id ?? "");
      setUsers(userResponse.users);
      setSelectedUserId(userResponse.users[0]?.id ?? "");
      setItems(menuResponse.items);
      const selectedMenuItem =
        menuResponse.items.find((item) => item.id === editingMenuId) ?? menuResponse.items[0];
      setEditingMenuId(selectedMenuItem?.id ?? "");
      setMenuForm(selectedMenuItem ? createMenuForm(selectedMenuItem) : emptyMenuForm);
      setCategories(publicMenuResponse.categories);
      setPickupRule(pickupResponse.rule);
      setPickupExceptions(pickupResponse.exceptions);
      setRuleForm({
        availableWeekdays: parseJsonList<number>(pickupResponse.rule?.available_weekdays_json, [1, 2, 3, 4, 5]),
        dailyCapacity: pickupResponse.rule?.daily_capacity ?? 18,
        timeSlots: parseJsonList<string>(pickupResponse.rule?.default_time_slots_json, ["14:00", "16:00", "18:00"]).join(","),
      });
    } catch {
      setErrorMessage("관리자 데이터를 불러오지 못했어요. 로그인 상태와 원격 API를 확인해 주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (currentUser.userType !== "admin") {
      navigate("/mypage");
      return;
    }

    void loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, navigate]);

  const filteredReservations = reservations.filter((reservation) => {
    const matchesStatus = statusFilter ? reservation.status === statusFilter : true;
    const normalizedQuery = query.trim();
    const matchesQuery = normalizedQuery
      ? [reservation.reservation_number, reservation.name, reservation.phone]
          .filter(Boolean)
          .some((value) => value.includes(normalizedQuery))
      : true;
    return matchesStatus && matchesQuery;
  });

  const filteredUsers = users.filter((user) => {
    const normalizedQuery = query.trim();
    return normalizedQuery
      ? [user.site_username ?? "", user.name, user.phone, user.email].some((value) =>
          value.includes(normalizedQuery),
        )
      : true;
  });

  const handleStatusChange = async (reservation: AdminReservation, status: string) => {
    setMessage("");
    setErrorMessage("");

    try {
      await apiRequest(`/admin/reservations/${reservation.id}/status`, {
        body: { adminNote: reservation.admin_note ?? "", status },
        method: "PATCH",
        token,
      });
      setMessage(`${reservation.reservation_number} 상태를 변경했어요.`);
      await loadAdminData();
      setActiveTab("reservations");
    } catch {
      setErrorMessage("예약 상태를 변경하지 못했어요.");
    }
  };

  const editMenu = (item: AdminItem) => {
    setEditingMenuId(item.id);
    setMenuForm(createMenuForm(item));
  };

  const handleMenuSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    const payload = {
      categoryId: menuForm.categoryId,
      description: menuForm.description,
      imageKey: menuForm.imageKey || null,
      imageUrl: menuForm.imageUrl || null,
      isReservable: menuForm.isReservable,
      isSeasonal: menuForm.isSeasonal,
      maxPerPerson: Number(menuForm.maxPerPerson),
      minPrepDays: Number(menuForm.minPrepDays),
      price: Number(menuForm.price),
      remainingLimitedQuantity: menuForm.remainingLimitedQuantity
        ? Number(menuForm.remainingLimitedQuantity)
        : null,
      slug: menuForm.slug,
      sortOrder: Number(menuForm.sortOrder),
      title: menuForm.title,
      totalLimitedQuantity: menuForm.totalLimitedQuantity ? Number(menuForm.totalLimitedQuantity) : null,
    };

    try {
      await apiRequest(editingMenuId ? `/admin/menus/${editingMenuId}` : "/admin/menus", {
        body: payload,
        method: editingMenuId ? "PATCH" : "POST",
        token,
      });
      setMessage(editingMenuId ? "메뉴를 수정했어요." : "메뉴를 추가했어요.");
      setEditingMenuId("");
      setMenuForm(emptyMenuForm);
      await loadAdminData();
      setActiveTab("menus");
    } catch {
      setErrorMessage("메뉴를 저장하지 못했어요. slug 중복이나 필수값을 확인해 주세요.");
    }
  };

  const handleMenuDelete = async (item: AdminItem) => {
    setMessage("");
    setErrorMessage("");

    try {
      await apiRequest(`/admin/menus/${item.id}`, {
        method: "DELETE",
        token,
      });
      setMessage("메뉴를 삭제하거나 숨김 처리했어요.");
      await loadAdminData();
    } catch {
      setErrorMessage("메뉴를 삭제하지 못했어요.");
    }
  };

  const selectedMenuItem = useMemo(
    () => items.find((item) => item.id === editingMenuId) ?? null,
    [editingMenuId, items],
  );

  const currentMenuImageUrl = normalizeAdminImageUrl(menuForm.imageUrl);

  const setUploadFile = (file: File | null) => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImageFile(file);
    setImagePreviewUrl(file ? createImagePreview(file) : "");
    setImageScale(1);
  };

  const openImageModal = () => {
    if (!editingMenuId) {
      setErrorMessage("먼저 메뉴를 선택하거나 저장해 주세요.");
      return;
    }

    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setUploadFile(null);
  };

  const uploadMenuImage = async () => {
    if (!imageFile || !editingMenuId) {
      return;
    }

    setIsImageUploading(true);
    setErrorMessage("");
    setMessage("");

    try {
      const resizedFile = await resizeImageFile(imageFile, imageScale);
      const formData = new FormData();
      formData.append("file", resizedFile);
      formData.append("itemId", editingMenuId);

      const response = await fetch(`${API_BASE_URL}/admin/media/menu-image`, {
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("이미지 업로드 실패");
      }

      const data = (await response.json()) as UploadedMedia;
      setMenuForm((current) => ({
        ...current,
        imageKey: data.media.key,
        imageUrl: data.media.publicPath,
      }));
      setMessage("메뉴 사진을 저장했어요.");
      closeImageModal();
      await loadAdminData();
      setActiveTab("menus");
      setEditingMenuId(editingMenuId);
    } catch {
      setErrorMessage("사진을 업로드하지 못했어요. 이미지 용량과 형식을 확인해 주세요.");
    } finally {
      setIsImageUploading(false);
    }
  };

  const deleteMenuImage = async () => {
    if (!editingMenuId || !selectedMenuItem?.image_key) {
      return;
    }

    const confirmed = window.confirm("이 메뉴 사진을 삭제할까요?");

    if (!confirmed) {
      return;
    }

    setMessage("");
    setErrorMessage("");

    try {
      await apiRequest(`/admin/media/object/${encodeURIComponent(selectedMenuItem.image_key)}`, {
        method: "DELETE",
        token,
      });
      setMenuForm((current) => ({
        ...current,
        imageKey: "",
        imageUrl: "",
      }));
      setMessage("메뉴 사진을 삭제했어요.");
      await loadAdminData();
      setActiveTab("menus");
    } catch {
      setErrorMessage("사진을 삭제하지 못했어요.");
    }
  };

  const handleRuleSave = async () => {
    setMessage("");
    setErrorMessage("");

    try {
      await apiRequest("/admin/pickup-rules", {
        body: {
          availableWeekdays: ruleForm.availableWeekdays,
          dailyCapacity: Number(ruleForm.dailyCapacity) || null,
          timeSlots: ruleForm.timeSlots.split(",").map((slot) => slot.trim()).filter(Boolean),
        },
        method: "PUT",
        token,
      });
      setMessage("픽업 기본 규칙을 저장했어요.");
      await loadAdminData();
    } catch {
      setErrorMessage("픽업 규칙을 저장하지 못했어요.");
    }
  };

  const handleExceptionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    try {
      await apiRequest("/admin/pickup-exceptions", {
        body: {
          date: exceptionForm.date,
          exceptionType: exceptionForm.exceptionType,
          reason: exceptionForm.reason || null,
          timeSlots:
            exceptionForm.exceptionType === "custom_hours"
              ? exceptionForm.timeSlots.split(",").map((slot) => slot.trim()).filter(Boolean)
              : null,
        },
        method: "POST",
        token,
      });
      setMessage("픽업 예외를 추가했어요.");
      setExceptionForm({
        date: "",
        exceptionType: "unavailable",
        reason: "",
        timeSlots: "14:00,16:00,18:00",
      });
      await loadAdminData();
    } catch {
      setErrorMessage("픽업 예외를 추가하지 못했어요.");
    }
  };

  const handleExceptionDelete = async (id: string) => {
    await apiRequest(`/admin/pickup-exceptions/${id}`, {
      method: "DELETE",
      token,
    });
    setMessage("픽업 예외를 삭제했어요.");
    await loadAdminData();
  };

  const renderTabButton = (tab: AdminTab, label: string, icon: ReactNode) => (
    <button aria-pressed={activeTab === tab} onClick={() => setActiveTab(tab)} type="button">
      {icon}
      {label}
    </button>
  );

  return (
    <>
      <section className="page-hero admin-page-hero">
        <p className="eyebrow">admin</p>
        <h1>예약과 픽업 운영을 한 곳에서 확인해요</h1>
        <p>입금 확인, 제작 상태, 메뉴와 픽업 가능 규칙을 원격 Cloudflare API로 관리합니다.</p>
      </section>

      <section className="admin-workspace">
        <div className="account-tabs admin-tabs" role="tablist" aria-label="관리자 메뉴">
          {renderTabButton("dashboard", "대시보드", <ClipboardList size={17} />)}
          {renderTabButton("reservations", "예약", <CalendarDays size={17} />)}
          {renderTabButton("members", "회원", <UsersRound size={17} />)}
          {renderTabButton("menus", "메뉴", <PackagePlus size={17} />)}
          {renderTabButton("rules", "픽업 규칙", <CalendarDays size={17} />)}
          <span className="admin-tabs-actions">
            <button className="admin-refresh-button" onClick={() => void loadAdminData()} type="button">
              <RefreshCw size={17} />
              새로고침
            </button>
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

        {message && <p className="form-success">{message}</p>}
        {errorMessage && <p className="form-error">{errorMessage}</p>}
        {isLoading && <p className="surface-message">관리자 데이터를 불러오는 중이에요.</p>}

        {activeTab === "dashboard" && dashboard && (
          <section className="admin-panel">
            <div className="admin-stat-grid">
              <div>
                <span>오늘 픽업</span>
                <strong>{dashboard.todayCount}</strong>
              </div>
              <div>
                <span>입금 확인 대기</span>
                <strong>{dashboard.pendingCount}</strong>
              </div>
              <div>
                <span>이번 주 예약</span>
                <strong>{dashboard.weekCount}</strong>
              </div>
              <div>
                <span>이번 주 예상 매출</span>
                <strong>{priceFormatter.format(dashboard.weekRevenue)}</strong>
              </div>
            </div>

            <div className="admin-two-column">
              <section>
                <h2>오늘 픽업 예정</h2>
                <div className="admin-list">
                  {dashboard.todayPickups.length === 0 ? (
                    <p className="surface-message">오늘 픽업 예약이 없어요.</p>
                  ) : (
                    dashboard.todayPickups.map((pickup) => (
                      <button
                        key={pickup.id}
                        onClick={() => {
                          setSelectedReservationId(pickup.id);
                          setActiveTab("reservations");
                        }}
                        type="button"
                      >
                        <span>{pickup.pickup_time} · {pickup.name}</span>
                        <strong>{pickup.reservation_number}</strong>
                        <small>{statusLabels[pickup.status] ?? pickup.status}</small>
                      </button>
                    ))
                  )}
                </div>
              </section>

              <section>
                <h2>인기 메뉴</h2>
                <div className="detail-item-list">
                  {dashboard.popularItems.map((item) => (
                    <div key={item.title}>
                      <span>{item.title}</span>
                      <strong>{item.quantity}개</strong>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </section>
        )}

        {activeTab === "reservations" && (
          <section className="admin-panel">
            <div className="admin-toolbar">
              <input onChange={(event) => setQuery(event.target.value)} placeholder="예약번호, 이름, 연락처 검색" value={query} />
              <select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
                <option value="">상태 전체</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="account-two-column">
              <div className="reservation-list">
                {filteredReservations.map((reservation) => (
                  <button
                    aria-pressed={selectedReservation?.id === reservation.id}
                    key={reservation.id}
                    onClick={() => setSelectedReservationId(reservation.id)}
                    type="button"
                  >
                    <span>{reservation.reservation_number}</span>
                    <strong>{reservation.name} · {reservation.pickup_date} {reservation.pickup_time}</strong>
                    <small>{statusLabels[reservation.status] ?? reservation.status}</small>
                  </button>
                ))}
              </div>

              {selectedReservation && (
                <aside className="reservation-detail-panel">
                  <p className="eyebrow">reservation</p>
                  <h3>{selectedReservation.reservation_number}</h3>
                  <dl className="receipt-lines">
                    <div>
                      <dt>예약자</dt>
                      <dd>{selectedReservation.name} · {selectedReservation.phone}</dd>
                    </div>
                    <div>
                      <dt>픽업</dt>
                      <dd>{selectedReservation.pickup_date} {selectedReservation.pickup_time}</dd>
                    </div>
                    <div>
                      <dt>상태</dt>
                      <dd>{statusLabels[selectedReservation.status] ?? selectedReservation.status}</dd>
                    </div>
                    <div>
                      <dt>합계</dt>
                      <dd>{priceFormatter.format(selectedReservation.total_payment_amount)}</dd>
                    </div>
                  </dl>
                  <div className="detail-item-list">
                    {(selectedReservation.items ?? []).map((item) => (
                      <div key={item.item_title_snapshot}>
                        <span>{item.item_title_snapshot}</span>
                        <strong>{item.quantity}개 · {priceFormatter.format(item.line_total)}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="status-actions">
                    {["payment_confirmed", "making", "pickup_ready", "picked_up", "cancelled"].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedReservation, status)}
                        type="button"
                      >
                        {statusLabels[status]}
                      </button>
                    ))}
                  </div>
                </aside>
              )}
            </div>
          </section>
        )}

        {activeTab === "members" && (
          <section className="admin-panel">
            <div className="admin-toolbar">
              <input onChange={(event) => setQuery(event.target.value)} placeholder="아이디, 이름, 연락처, 이메일 검색" value={query} />
            </div>
            <div className="account-two-column">
              <div className="reservation-list">
                {filteredUsers.map((user) => (
                  <button
                    aria-pressed={selectedUser?.id === user.id}
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    type="button"
                  >
                    <span>{user.site_username ?? "비회원 예약자"}</span>
                    <strong>{user.name} · {user.phone}</strong>
                    <small>{user.user_type}</small>
                  </button>
                ))}
              </div>
              {selectedUser && (
                <aside className="reservation-detail-panel">
                  <p className="eyebrow">member</p>
                  <h3>{selectedUser.name}</h3>
                  <dl className="receipt-lines">
                    <div>
                      <dt>아이디</dt>
                      <dd>{selectedUser.site_username ?? "-"}</dd>
                    </div>
                    <div>
                      <dt>연락처</dt>
                      <dd>{selectedUser.phone}</dd>
                    </div>
                    <div>
                      <dt>이메일</dt>
                      <dd>{selectedUser.email}</dd>
                    </div>
                    <div>
                      <dt>마일리지</dt>
                      <dd>{selectedUser.mileage_points.toLocaleString()} P</dd>
                    </div>
                    <div>
                      <dt>주소</dt>
                      <dd>{selectedUser.address}</dd>
                    </div>
                  </dl>
                </aside>
              )}
            </div>
          </section>
        )}

        {activeTab === "menus" && (
          <section className="admin-panel">
            <div className="admin-two-column admin-menu-layout">
              <section>
                <h2>메뉴 목록</h2>
                <div className="admin-list">
                  {items.map((item) => (
                    <button
                      aria-pressed={editingMenuId === item.id}
                      key={item.id}
                      onClick={() => editMenu(item)}
                      type="button"
                    >
                      <span>{item.category_name} · {item.is_reservable ? "예약 가능" : "예약 불가"}</span>
                      <strong>{item.title}</strong>
                      <small>{priceFormatter.format(item.price)} · 최소 준비 시간 {item.min_prep_days}일</small>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h2>{editingMenuId ? "메뉴 수정" : "메뉴 추가"}</h2>
                <div className="admin-menu-photo">
                  <button
                    className="admin-menu-photo-button"
                    onClick={openImageModal}
                    type="button"
                  >
                    {currentMenuImageUrl ? (
                      <img src={currentMenuImageUrl} alt="" />
                    ) : (
                      <span>
                        <ImagePlus size={24} />
                        사진 추가하기
                      </span>
                    )}
                    {currentMenuImageUrl && <em>사진 수정하기</em>}
                  </button>
                  {currentMenuImageUrl && (
                    <button
                      aria-label="사진 삭제"
                      className="admin-menu-photo-delete"
                      onClick={deleteMenuImage}
                      type="button"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <form className="admin-form" onSubmit={handleMenuSubmit}>
                  <label className="form-field">
                    <span>제목</span>
                    <input required value={menuForm.title} onChange={(event) => setMenuForm((current) => ({ ...current, title: event.target.value }))} />
                  </label>
                  <label className="form-field">
                    <span>Slug</span>
                    <input required value={menuForm.slug} onChange={(event) => setMenuForm((current) => ({ ...current, slug: event.target.value }))} />
                  </label>
                  <label className="form-field">
                    <span>카테고리</span>
                    <select value={menuForm.categoryId} onChange={(event) => setMenuForm((current) => ({ ...current, categoryId: event.target.value }))}>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name ?? category.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="form-field">
                    <span>설명</span>
                    <textarea required value={menuForm.description} onChange={(event) => setMenuForm((current) => ({ ...current, description: event.target.value }))} />
                  </label>
                  <div className="form-grid">
                    <label className="form-field">
                      <span>가격</span>
                      <input type="number" value={menuForm.price} onChange={(event) => setMenuForm((current) => ({ ...current, price: Number(event.target.value) }))} />
                    </label>
                    <label className="form-field">
                      <span>최소 준비 시간</span>
                      <input type="number" value={menuForm.minPrepDays} onChange={(event) => setMenuForm((current) => ({ ...current, minPrepDays: Number(event.target.value) }))} />
                    </label>
                  </div>
                  <div className="form-grid">
                    <label className="form-field">
                      <span>인당 최대 수량</span>
                      <input type="number" value={menuForm.maxPerPerson} onChange={(event) => setMenuForm((current) => ({ ...current, maxPerPerson: Number(event.target.value) }))} />
                    </label>
                    <label className="form-field">
                      <span>한정 수량</span>
                      <input value={menuForm.totalLimitedQuantity} onChange={(event) => setMenuForm((current) => ({ ...current, totalLimitedQuantity: event.target.value }))} />
                    </label>
                  </div>
                  <label className="form-field">
                    <span>이미지 URL</span>
                    <input value={menuForm.imageUrl} onChange={(event) => setMenuForm((current) => ({ ...current, imageUrl: event.target.value }))} />
                  </label>
                  <div className="admin-check-row">
                    <CheckControl
                      checked={menuForm.isSeasonal}
                      onChange={(checked) => setMenuForm((current) => ({ ...current, isSeasonal: checked }))}
                    >
                      시즌 메뉴
                    </CheckControl>
                    <CheckControl
                      checked={menuForm.isReservable}
                      onChange={(checked) => setMenuForm((current) => ({ ...current, isReservable: checked }))}
                    >
                      예약 가능
                    </CheckControl>
                  </div>
                  <button className="submit-reservation" type="submit">
                    <Save size={17} />
                    저장
                  </button>
                  {editingMenuId && (
                    <button className="danger-action" onClick={() => handleMenuDelete(items.find((item) => item.id === editingMenuId)!)} type="button">
                      삭제 또는 숨김
                    </button>
                  )}
                </form>
              </section>
            </div>
          </section>
        )}

        {activeTab === "rules" && (
          <section className="admin-panel">
            <div className="admin-two-column">
              <section>
                <h2>기본 픽업 규칙</h2>
                <div className="weekday-grid">
                  {weekdays.map((weekday) => (
                    <button
                      aria-pressed={ruleForm.availableWeekdays.includes(weekday.value)}
                      key={weekday.value}
                      onClick={() =>
                        setRuleForm((current) => ({
                          ...current,
                          availableWeekdays: current.availableWeekdays.includes(weekday.value)
                            ? current.availableWeekdays.filter((value) => value !== weekday.value)
                            : [...current.availableWeekdays, weekday.value].sort(),
                        }))
                      }
                      type="button"
                    >
                      {weekday.label}
                    </button>
                  ))}
                </div>
                <label className="form-field">
                  <span>기본 시간대</span>
                  <input value={ruleForm.timeSlots} onChange={(event) => setRuleForm((current) => ({ ...current, timeSlots: event.target.value }))} />
                </label>
                <label className="form-field">
                  <span>하루 총 예약 가능 수</span>
                  <input type="number" value={ruleForm.dailyCapacity} onChange={(event) => setRuleForm((current) => ({ ...current, dailyCapacity: Number(event.target.value) }))} />
                </label>
                <button className="submit-reservation" onClick={handleRuleSave} type="button">
                  기본 규칙 저장
                </button>
                {pickupRule && <p className="surface-message">마지막 저장 기준: {pickupRule.id}</p>}
              </section>

              <section>
                <h2>예외 날짜/시간</h2>
                <form className="admin-form" onSubmit={handleExceptionSubmit}>
                  <label className="form-field">
                    <span>날짜</span>
                    <input required type="date" value={exceptionForm.date} onChange={(event) => setExceptionForm((current) => ({ ...current, date: event.target.value }))} />
                  </label>
                  <label className="form-field">
                    <span>유형</span>
                    <select value={exceptionForm.exceptionType} onChange={(event) => setExceptionForm((current) => ({ ...current, exceptionType: event.target.value as "unavailable" | "custom_hours" }))}>
                      <option value="unavailable">전체 픽업 불가</option>
                      <option value="custom_hours">커스텀 시간대</option>
                    </select>
                  </label>
                  {exceptionForm.exceptionType === "custom_hours" && (
                    <label className="form-field">
                      <span>가능 시간대</span>
                      <input value={exceptionForm.timeSlots} onChange={(event) => setExceptionForm((current) => ({ ...current, timeSlots: event.target.value }))} />
                    </label>
                  )}
                  <label className="form-field">
                    <span>메모</span>
                    <input value={exceptionForm.reason} onChange={(event) => setExceptionForm((current) => ({ ...current, reason: event.target.value }))} />
                  </label>
                  <button className="submit-reservation" type="submit">예외 추가</button>
                </form>
                <div className="detail-item-list">
                  {pickupExceptions.map((exception) => (
                    <div key={exception.id}>
                      <span>
                        {exception.date} · {exception.exception_type === "unavailable" ? "전체 불가" : exception.time_slots_json}
                      </span>
                      <button onClick={() => handleExceptionDelete(exception.id)} type="button">삭제</button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </section>
        )}
      </section>

      {imageModalOpen && (
        <div className="image-modal-backdrop" role="presentation">
          <section className="image-modal" role="dialog" aria-modal="true" aria-label="메뉴 사진 업로드">
            <button className="image-modal-close" onClick={closeImageModal} type="button">
              <X size={18} />
            </button>
            <p className="eyebrow">menu photo</p>
            <h2>메뉴 사진 업로드</h2>
            <label
              className="image-dropzone"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                setUploadFile(event.dataTransfer.files[0] ?? null);
              }}
            >
              {imagePreviewUrl ? (
                <img src={imagePreviewUrl} alt="" />
              ) : (
                <span>
                  <ImagePlus size={28} />
                  Drag&Drop 또는 여기를 터치해서 이미지 업로드
                </span>
              )}
              <input
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                type="file"
              />
            </label>
            <label className="form-field">
              <span>이미지 크기 조정하기</span>
              <input
                max="1.8"
                min="1"
                onChange={(event) => setImageScale(Number(event.target.value))}
                step="0.05"
                type="range"
                value={imageScale}
              />
            </label>
            <button
              className="submit-reservation"
              disabled={!imageFile || isImageUploading}
              onClick={uploadMenuImage}
              type="button"
            >
              {isImageUploading ? "저장 중" : "저장"}
            </button>
          </section>
        </div>
      )}

      <SiteFooter />
    </>
  );
}
