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
  warning.textContent = "저장된 일기를 읽지 못했습니다. 브라우저 저장 공간을 확인해 주세요.";
  document.querySelector("main").prepend(warning);
}

function isDiaryEntry(value) {
  return value !== null
    && typeof value === "object"
    && typeof value.id === "string"
    && (value.mode === "simple" || value.mode === "general")
    && typeof value.title === "string"
    && typeof value.content === "string"
    && MOODS.some((mood) => mood.name === value.mood)
    && typeof value.createdAt === "string"
    && typeof value.updatedAt === "string";
}

function saveEntries(nextEntries) {
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
