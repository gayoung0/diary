initializeTheme();
entries = loadEntries();

if (page === "list") initializeListPage();
if (page === "write") initializeWritePage();
if (page === "detail") initializeDetailPage();
if (page === "stats") initializeStatsPage();
if (storageLoadFailed) renderStorageWarning();
