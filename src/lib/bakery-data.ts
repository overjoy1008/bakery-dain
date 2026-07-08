import { apiRequest } from "./api";
import {
  menuCategories as fallbackCategories,
  menuItems as fallbackItems,
  noticeItems as fallbackNotices,
} from "../data/brandShell";

export type BakeryMenuCategory = {
  id: string;
  label: string;
  slug: string;
};

export type BakeryMenuItem = {
  badge: string;
  category: string;
  categoryLabel: string;
  description: string;
  id: string;
  image: string;
  imageAlt: string;
  maxPerPerson: number;
  name: string;
  pickupLabel: string;
  prepDays: number;
  price: number;
  remainingLimitedQuantity: number | null;
  slug: string;
  status: string;
  totalLimitedQuantity: number | null;
};

export type BakeryMenuCatalog = {
  categories: BakeryMenuCategory[];
  items: BakeryMenuItem[];
};

export type PickupDay = {
  dailyCapacity: number;
  date: string;
  dateLabel: string;
  dayLabel: string;
  leadDays: number;
  status: "available" | "day_off";
  statusLabel: string;
  timeSlots: string[];
};

type ApiCategory = {
  id: string;
  name: string;
  slug: string;
};

type ApiItem = {
  category_id: string;
  category_name: string;
  description: string;
  id: string;
  image_url: string | null;
  is_seasonal: number;
  max_per_person: number;
  min_prep_days: number;
  price: number;
  remaining_limited_quantity: number | null;
  slug: string;
  title: string;
  total_limited_quantity: number | null;
};

type ApiNotice = {
  text: string;
};

type ApiPickupRule = {
  available_weekdays_json: string;
  daily_capacity: number | null;
  default_time_slots_json: string;
} | null;

type ApiPickupException = {
  date: string;
  exception_type: "unavailable" | "custom_hours";
  time_slots_json: string | null;
};

const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];

function getCurrentKstDateString() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Seoul",
    year: "numeric",
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "07";
  const day = parts.find((part) => part.type === "day")?.value ?? "08";
  return `${year}-${month}-${day}`;
}

function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseJsonList<TValue>(value: string | null | undefined, fallback: TValue[]) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as TValue[];
  } catch {
    return fallback;
  }
}

function mapItem(item: ApiItem): BakeryMenuItem {
  const limitedQuantity = item.remaining_limited_quantity;

  return {
    badge: item.is_seasonal ? "시즌" : limitedQuantity === null ? "예약" : "한정",
    category: item.category_id,
    categoryLabel: item.category_name,
    description: item.description,
    id: item.id,
    image: item.image_url ?? "/images/menu/walnut-tart.png",
    imageAlt: item.title,
    maxPerPerson: item.max_per_person,
    name: item.title,
    pickupLabel: `${item.min_prep_days}일 전 예약`,
    prepDays: item.min_prep_days,
    price: item.price,
    remainingLimitedQuantity: item.remaining_limited_quantity,
    slug: item.slug,
    status: limitedQuantity === null ? "예약 가능" : `한정 ${limitedQuantity}개`,
    totalLimitedQuantity: item.total_limited_quantity,
  };
}

function createPickupDays(rule: ApiPickupRule, exceptions: ApiPickupException[]) {
  const availableWeekdays = parseJsonList<number>(rule?.available_weekdays_json, [1, 2, 3, 4, 5]);
  const defaultTimeSlots = parseJsonList<string>(rule?.default_time_slots_json, [
    "14:00",
    "16:00",
    "18:00",
  ]);
  const dailyCapacity = rule?.daily_capacity ?? 18;
  const exceptionByDate = new Map(exceptions.map((exception) => [exception.date, exception]));
  const baseDate = getCurrentKstDateString();

  return Array.from({ length: 14 }, (_, index): PickupDay => {
    const leadDays = index + 1;
    const date = addDays(baseDate, leadDays);
    const dateString = formatDate(date);
    const dayIndex = date.getDay();
    const exception = exceptionByDate.get(dateString);
    const customTimeSlots = parseJsonList<string>(exception?.time_slots_json, defaultTimeSlots);
    const isAvailable =
      availableWeekdays.includes(dayIndex) && exception?.exception_type !== "unavailable";

    return {
      dailyCapacity: isAvailable ? dailyCapacity : 0,
      date: dateString,
      dateLabel: `${date.getMonth() + 1}/${date.getDate()}`,
      dayLabel: dayLabels[dayIndex],
      leadDays,
      status: isAvailable ? "available" : "day_off",
      statusLabel: isAvailable ? "픽업 가능" : "픽업 불가",
      timeSlots: isAvailable
        ? exception?.exception_type === "custom_hours"
          ? customTimeSlots
          : defaultTimeSlots
        : [],
    };
  });
}

export async function loadSiteNotices() {
  const response = await apiRequest<{ notices: ApiNotice[] }>("/public/site");
  return response.notices.map((notice) => notice.text);
}

export async function loadMenuCatalog(): Promise<BakeryMenuCatalog> {
  const response = await apiRequest<{ categories: ApiCategory[]; items: ApiItem[] }>(
    "/public/menus",
  );

  return {
    categories: [
      { id: "all", label: "전체", slug: "all" },
      ...response.categories.map((category) => ({
        id: category.id,
        label: category.name,
        slug: category.slug,
      })),
    ],
    items: response.items.map(mapItem),
  };
}

export async function loadPickupDays() {
  const response = await apiRequest<{
    exceptions: ApiPickupException[];
    rule: ApiPickupRule;
  }>("/public/pickup-rules");

  return createPickupDays(response.rule, response.exceptions);
}

export const fallbackMenuCatalog: BakeryMenuCatalog = {
  categories: fallbackCategories.map((category) => ({
    id: category.id,
    label: category.label,
    slug: category.id,
  })),
  items: fallbackItems.map((item) => ({
    ...item,
    maxPerPerson: 6,
    remainingLimitedQuantity: null,
    slug: item.id,
    totalLimitedQuantity: null,
  })),
};

export const fallbackNoticeItems = fallbackNotices;
