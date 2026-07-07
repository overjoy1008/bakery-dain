type PickupDayStatus = "available" | "day_off";

type PickupDay = {
  date: string;
  dateLabel: string;
  dayLabel: string;
  status: PickupDayStatus;
  statusLabel: string;
  timeSlots: string[];
  dailyCapacity: number;
};

type AdminPickupRule = {
  baseDate: string;
  weeklyAvailableDayIndexes: number[];
  blockedDates: string[];
  defaultTimeSlots: string[];
  timeSlotsByDayIndex: Record<number, string[]>;
  dailyCapacity: number;
};

const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];

function getCurrentKstDateString() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "07";
  const day = parts.find((part) => part.type === "day")?.value ?? "07";
  return `${year}-${month}-${day}`;
}

export const adminPickupRule: AdminPickupRule = {
  baseDate: getCurrentKstDateString(),
  weeklyAvailableDayIndexes: [1, 2, 3, 4, 5],
  blockedDates: ["2026-07-13", "2026-07-20"],
  defaultTimeSlots: ["14:00", "16:00", "18:00"],
  timeSlotsByDayIndex: {
    1: ["15:00", "17:00"],
    3: ["13:00", "15:00", "17:00"],
    5: ["13:00", "16:00"],
  },
  dailyCapacity: 18,
};

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date;
}

function createPickupDay(date: Date): PickupDay {
  const dateString = formatDate(date);
  const dayIndex = date.getDay();
  const isWeeklyAvailable = adminPickupRule.weeklyAvailableDayIndexes.includes(dayIndex);
  const isBlocked = adminPickupRule.blockedDates.includes(dateString);
  const isAvailable = isWeeklyAvailable && !isBlocked;

  return {
    date: dateString,
    dateLabel: formatDateLabel(date),
    dayLabel: dayLabels[dayIndex],
    dailyCapacity: isAvailable ? adminPickupRule.dailyCapacity : 0,
    status: isAvailable ? "available" : "day_off",
    statusLabel: isAvailable ? "픽업 가능" : "픽업 불가",
    timeSlots: isAvailable
      ? adminPickupRule.timeSlotsByDayIndex[dayIndex] ?? adminPickupRule.defaultTimeSlots
      : [],
  };
}

export const pickupDays: PickupDay[] = Array.from({ length: 14 }, (_, index) =>
  createPickupDay(addDays(adminPickupRule.baseDate, index + 1)),
);
