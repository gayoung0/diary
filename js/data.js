// 감정 이름과 아이콘은 작성, 목록, 상세 화면에서 이 목록을 함께 사용합니다.
const MOODS = [
  { name: "기쁨", icon: "☀️", color: "#e9ab59" },
  { name: "평온", icon: "🌿", color: "#6d9a7a" },
  { name: "슬픔", icon: "🌧️", color: "#7195c4" },
  { name: "화남", icon: "🔥", color: "#d87965" },
  { name: "불안", icon: "🌫️", color: "#9987b8" },
];

const STORAGE_KEY = "maeum-diary-entries";
const DRAFT_STORAGE_KEY = "maeum-diary-draft";
const THEME_STORAGE_KEY = "maeum-diary-theme";
const page = document.body.dataset.page;
let storageLoadFailed = false;
let entries = [];

// 저장된 전체 데이터를 읽고, 일부라도 형식이 잘못되면 원본을 유지하며 실패 처리합니다.
function loadEntries() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return [];

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every(isDiaryEntry)) {
      throw new Error("저장된 일기 데이터의 형식이 올바르지 않습니다.");
    }
    return parsed;
  } catch (error) {
    console.error("일기를 불러오지 못했습니다.", error);
    storageLoadFailed = true;
    return [];
  }
}

function renderStorageWarning() {
  const warning = document.createElement("p");
  warning.className = "storage-warning";
  warning.setAttribute("role", "alert");
  warning.textContent = "저장된 일기를 읽지 못했습니다. 원본 데이터를 보호하기 위해 저장·수정·삭제를 막았습니다. 기존 데이터는 삭제하지 않았습니다. 브라우저 저장 공간을 확인해 주세요.";
  document.querySelector("main").prepend(warning);
}

// 화면에서 사용할 일기 한 건의 필수 값과 모드별 규칙을 확인합니다.
function isDiaryEntry(value) {
  return value !== null
    && typeof value === "object"
    && typeof value.id === "string"
    && (value.mode === "simple" || value.mode === "general")
    && typeof value.title === "string"
    && value.title.trim() !== ""
    && typeof value.content === "string"
    && (value.mode !== "general" || value.content.trim() !== "")
    && MOODS.some((mood) => mood.name === value.mood)
    && isValidDateString(value.createdAt)
    && isValidDateString(value.updatedAt);
}

// 날짜 파싱 가능 여부와 날짜 문자열의 연·월·일이 실제 달력 날짜인지 확인합니다.
function isValidDateString(value) {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return false;

  const dateParts = /^(\d{4})-(\d{2})-(\d{2})(?:T|$)/.exec(value);
  if (!dateParts) return false;

  const year = Number(dateParts[1]);
  const month = Number(dateParts[2]);
  const day = Number(dateParts[3]);
  const calendarDate = new Date(0);
  calendarDate.setUTCFullYear(year, month - 1, day);
  return calendarDate.getUTCFullYear() === year
    && calendarDate.getUTCMonth() === month - 1
    && calendarDate.getUTCDate() === day;
}

function getStorageWriteErrorMessage(action) {
  if (storageLoadFailed) {
    return `저장된 데이터를 읽지 못해 원본 보호를 위해 ${action}할 수 없습니다.`;
  }
  return `${action}하지 못했어요. 브라우저 저장 공간을 확인해 주세요.`;
}

// 읽기에 실패한 상태에서는 저장을 막아 손상된 원본이 덮어써지지 않게 합니다.
function saveEntries(nextEntries) {
  if (storageLoadFailed) return false;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries));
    entries = nextEntries;
    return true;
  } catch (error) {
    console.error("일기를 저장하지 못했습니다.", error);
    return false;
  }
}

function createId() {
  // 브라우저가 UUID 생성을 지원하지 않는 경우에도 고유한 ID를 만듭니다.
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
