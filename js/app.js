// 공통 설정과 저장 데이터를 먼저 준비한 뒤 현재 페이지 기능을 시작합니다.
initializeTheme();
entries = loadEntries();

// HTML의 data-page 값에 맞는 화면만 초기화합니다.
if (page === "list") initializeListPage();
if (page === "write") initializeWritePage();
if (page === "detail") initializeDetailPage();
if (page === "stats") initializeStatsPage();

// 저장 데이터를 읽지 못한 경우, 각 화면 위에 원본 보호 안내를 표시합니다.
if (storageLoadFailed) renderStorageWarning();
