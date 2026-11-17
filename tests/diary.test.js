const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const scriptFiles = [
  "data.js",
  "list.js",
  "stats.js",
  "write.js",
];

function runProjectScript(fileName) {
  const source = fs.readFileSync(path.join(projectRoot, "js", fileName), "utf8");
  const script = document.createElement("script");
  script.textContent = source;
  document.head.append(script);
}

function loadPageMarkup(fileName, pageName) {
  const source = fs.readFileSync(path.join(projectRoot, fileName), "utf8");
  const parsedPage = new DOMParser().parseFromString(source, "text/html");
  document.body.innerHTML = parsedPage.body.innerHTML;
  document.body.dataset.page = pageName;
}

function makeEntry(id, mood, createdAt, mode = "simple", title = id) {
  return {
    id,
    mode,
    title,
    content: mode === "general" ? "기록 내용" : "",
    mood,
    createdAt,
    updatedAt: createdAt,
  };
}

function setEntries(value) {
  window.eval(`entries = ${JSON.stringify(value)}`);
}

function getWeeklyDays(entries, referenceDate) {
  return window.eval(`getWeeklyWritingDays(
    ${JSON.stringify(entries)},
    new Date(${referenceDate.getFullYear()}, ${referenceDate.getMonth()}, ${referenceDate.getDate()}, 12)
  )`);
}

beforeAll(() => {
  scriptFiles.forEach(runProjectScript);
});

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = "";
  document.body.dataset.page = "";
  window.eval("storageLoadFailed = false; entries = [];");
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("일기 저장소", () => {
  test("localStorage에 저장한 일기를 정상적으로 불러온다", () => {
    const savedEntries = [
      makeEntry("entry-1", "기쁨", "2026-11-17T09:30:00.000Z"),
    ];
    localStorage.setItem("maeum-diary-entries", JSON.stringify(savedEntries));

    expect(window.eval("loadEntries()")).toEqual(savedEntries);
  });

  test("손상된 JSON을 읽으면 오류 상태를 기록하고 빈 목록을 반환한다", () => {
    localStorage.setItem("maeum-diary-entries", "{잘못된 json");
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(window.eval("loadEntries()")).toEqual([]);
    expect(window.eval("storageLoadFailed")).toBe(true);

    loadPageMarkup("index.html", "list");
    window.eval("renderStorageWarning()");
    expect(document.querySelector('[role="alert"]').textContent).toContain("저장된 일기를 읽지 못했습니다");
    consoleError.mockRestore();
  });

  test("읽기 실패 후 새 일기 저장을 시도해도 localStorage 원본을 보존한다", () => {
    const originalValue = "{잘못된 json";
    localStorage.setItem("maeum-diary-entries", originalValue);
    jest.spyOn(console, "error").mockImplementation(() => {});
    window.eval("entries = loadEntries()");

    loadPageMarkup("write.html", "write");
    window.eval("initializeWritePage()");
    window.eval("renderStorageWarning()");
    document.querySelector("#simple-title").value = "좋았다";
    document.querySelector('input[name="mood"][value="평온"]').checked = true;
    document.querySelector("#diary-form").dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );

    expect(localStorage.getItem("maeum-diary-entries")).toBe(originalValue);
    expect(document.querySelector("#form-message").textContent).toContain("원본 보호를 위해 저장할 수 없습니다");
    expect(document.querySelector('[role="alert"]').textContent).toContain("저장·수정·삭제를 막았습니다");
  });

  test("읽기 실패 상태에서는 공통 저장 함수가 변경을 거부하고 원본을 보존한다", () => {
    const originalValue = '[{"not":"valid diary data"}]';
    localStorage.setItem("maeum-diary-entries", originalValue);
    jest.spyOn(console, "error").mockImplementation(() => {});
    window.eval("entries = loadEntries()");

    expect(window.eval("saveEntries([])")).toBe(false);
    expect(localStorage.getItem("maeum-diary-entries")).toBe(originalValue);
  });

  test.each([
    ["createdAt이 잘못된 날짜", { createdAt: "not-a-date" }],
    ["createdAt이 달력에 없는 날짜", { createdAt: "2026-02-31T12:00:00.000Z" }],
    ["updatedAt이 잘못된 날짜", { updatedAt: "not-a-date" }],
    ["제목이 공백뿐인 경우", { title: " \t " }],
    ["일반 모드의 내용이 공백뿐인 경우", { mode: "general", content: " \n " }],
    ["허용되지 않은 모드", { mode: "unknown" }],
    ["허용되지 않은 감정", { mood: "즐거움" }],
  ])("%s인 저장 데이터는 읽기 실패로 처리하고 원본을 보존한다", (_caseName, overrides) => {
    const invalidEntry = {
      ...makeEntry("invalid-entry", "기쁨", "2026-11-17T09:30:00.000Z"),
      ...overrides,
    };
    const originalValue = JSON.stringify([invalidEntry]);
    localStorage.setItem("maeum-diary-entries", originalValue);
    jest.spyOn(console, "error").mockImplementation(() => {});

    expect(window.eval("loadEntries()")).toEqual([]);
    expect(window.eval("storageLoadFailed")).toBe(true);
    expect(localStorage.getItem("maeum-diary-entries")).toBe(originalValue);
  });

  test("간단 모드의 빈 내용은 유효한 저장 데이터로 불러온다", () => {
    const savedEntries = [
      makeEntry("simple-entry", "평온", "2026-11-17T09:30:00.000Z"),
    ];
    localStorage.setItem("maeum-diary-entries", JSON.stringify(savedEntries));

    expect(window.eval("loadEntries()")).toEqual(savedEntries);
    expect(window.eval("storageLoadFailed")).toBe(false);
  });
});

describe("일기 작성", () => {
  beforeEach(() => {
    loadPageMarkup("write.html", "write");
    window.eval("initializeWritePage()");
  });

  test("간단 모드는 제목과 감정만으로 일기를 저장한다", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    document.querySelector("#simple-title").value = "좋았다";
    document.querySelector('input[name="mood"][value="평온"]').checked = true;
    document.querySelector("#diary-form").dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );

    const saved = JSON.parse(localStorage.getItem("maeum-diary-entries"));
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      mode: "simple",
      title: "좋았다",
      content: "",
      mood: "평온",
    });
    expect(saved[0].id).toBeTruthy();
    expect(saved[0].createdAt).toBe(saved[0].updatedAt);
  });

  test.each([
    ["제목이 빈 문자열", "", "내용 있음"],
    ["제목이 공백", "   ", "내용 있음"],
    ["내용이 빈 문자열", "제목 있음", ""],
    ["내용이 공백", "제목 있음", " \n  "],
  ])("일반 모드에서 %s이면 저장하지 않는다", (_caseName, title, content) => {
    const generalMode = document.querySelector('input[name="mode"][value="general"]');
    generalMode.checked = true;
    generalMode.dispatchEvent(new Event("change", { bubbles: true }));
    document.querySelector("#general-title").value = title;
    document.querySelector("#diary-content").value = content;
    document.querySelector('input[name="mood"][value="기쁨"]').checked = true;

    document.querySelector("#diary-form").dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );

    expect(localStorage.getItem("maeum-diary-entries")).toBeNull();
    expect(document.querySelector("#form-message").textContent).toContain("제목, 내용, 감정을 모두 입력");
  });
});

describe("목록 감정 필터와 집계", () => {
  test("선택한 감정만 목록에 표시하고 감정별 개수를 정확히 표시한다", () => {
    const savedEntries = [
      makeEntry("joy-1", "기쁨", "2026-11-16T08:00:00"),
      makeEntry("joy-2", "기쁨", "2026-11-17T08:00:00"),
      makeEntry("calm-1", "평온", "2026-11-17T09:00:00"),
    ];
    setEntries(savedEntries);
    loadPageMarkup("index.html", "list");
    window.eval("initializeListPage()");

    const moodButtons = [...document.querySelectorAll("#mood-counts button")];
    expect(moodButtons.map((button) => button.textContent)).toEqual([
      "전체 3",
      "☀️ 기쁨 2",
      "🌿 평온 1",
      "🌧️ 슬픔 0",
      "🔥 화남 0",
      "🌫️ 불안 0",
    ]);

    moodButtons.find((button) => button.textContent === "🌿 평온 1").click();
    expect(document.querySelectorAll("#entry-list li")).toHaveLength(1);
    expect(document.querySelector("#entry-list").textContent).toContain("calm-1");
    expect(document.querySelector("#list-heading").textContent).toBe("평온 감정 기록");
  });
});

describe("주별 작성 빈도 집계", () => {
  const referenceDate = new Date(2025, 0, 8, 12);

  test("같은 날 여러 편을 작성해도 작성 일수는 1일이다", () => {
    const sameDayEntries = [
      makeEntry("one", "기쁨", "2025-01-07T08:00:00"),
      makeEntry("two", "평온", "2025-01-07T12:00:00"),
      makeEntry("three", "슬픔", "2025-01-07T20:00:00"),
    ];

    const weeks = getWeeklyDays(sameDayEntries, referenceDate);
    expect(weeks.map((week) => week.days)).toEqual([0, 0, 0, 1]);
  });

  test("같은 날 일부만 삭제해도 날짜가 집계되고 마지막 기록 삭제 시 제외된다", () => {
    const sameDayEntries = [
      makeEntry("one", "기쁨", "2025-01-07T08:00:00"),
      makeEntry("two", "평온", "2025-01-07T12:00:00"),
      makeEntry("three", "슬픔", "2025-01-07T20:00:00"),
    ];

    expect(getWeeklyDays(sameDayEntries.slice(1), referenceDate)[3].days).toBe(1);
    expect(getWeeklyDays(sameDayEntries.filter((entry) => entry.id !== "one"), referenceDate)[3].days).toBe(1);
    expect(getWeeklyDays([], referenceDate)[3].days).toBe(0);
  });

  test("일요일과 다음 월요일은 서로 다른 주에 집계한다", () => {
    const entries = [
      {
        ...makeEntry("sunday", "기쁨", "2025-01-05T12:00:00"),
        updatedAt: "2030-07-14T12:00:00",
      },
      {
        ...makeEntry("monday", "기쁨", "2025-01-06T12:00:00"),
        updatedAt: "2020-03-02T12:00:00",
      },
    ];

    const weeks = getWeeklyDays(entries, referenceDate);
    expect(weeks.map((week) => week.days)).toEqual([0, 0, 1, 1]);
    expect(weeks[2].start).toEqual(new Date(2024, 11, 30));
    expect(weeks[3].start).toEqual(new Date(2025, 0, 6));
  });

  test("기록이 없으면 최근 4주 모두 0일이다", () => {
    expect(getWeeklyDays([], referenceDate).map((week) => week.days)).toEqual([0, 0, 0, 0]);
  });
});
