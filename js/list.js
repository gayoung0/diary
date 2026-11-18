function initializeListPage() {
  let activeMood = null;
  const moodCounts = document.querySelector("#mood-counts");
  const entryList = document.querySelector("#entry-list");
  const entryTotal = document.querySelector("#entry-total");
  const listHeading = document.querySelector("#list-heading");
  const emptyState = document.querySelector("#empty-state");
  const showAllButton = document.querySelector("#show-all");

  showAllButton.addEventListener("click", () => {
    activeMood = null;
    renderList();
  });

  // 선택된 감정에 맞춰 일기 목록, 제목, 빈 목록 안내를 다시 그립니다.
  function renderList() {
    renderMoodCounts();
    entryList.replaceChildren();

    const visibleEntries = activeMood
      ? entries.filter((entry) => entry.mood === activeMood)
      : entries;
    visibleEntries.forEach((entry) => {
      const item = document.createElement("li");
      item.className = "entry-list-item";

      const link = document.createElement("a");
      link.className = "entry-select entry-link";
      link.href = `diary.html?id=${encodeURIComponent(entry.id)}`;

      const title = document.createElement("span");
      title.className = "entry-select-title";
      title.textContent = entry.title;

      const meta = document.createElement("span");
      meta.className = "entry-select-meta";
      const mood = MOODS.find((itemMood) => itemMood.name === entry.mood);
      const moodLabel = document.createElement("span");
      moodLabel.textContent = `${mood.icon} ${entry.mood}`;
      const date = document.createElement("time");
      date.dateTime = entry.createdAt;
      date.textContent = formatDate(entry.createdAt);
      meta.append(moodLabel, date);
      link.append(title, meta);
      item.append(link);
      entryList.append(item);
    });

    entryTotal.textContent = String(entries.length);
    listHeading.textContent = activeMood ? `${activeMood} 감정 기록` : "전체 기록";
    showAllButton.hidden = activeMood === null;
    entryList.hidden = visibleEntries.length === 0;
    emptyState.hidden = visibleEntries.length > 0;
    if (visibleEntries.length === 0 && activeMood) {
      emptyState.querySelector("strong").textContent = `${activeMood} 감정 기록이 없어요`;
      emptyState.querySelector("span:last-of-type").textContent = "다른 감정을 선택하거나 전체 기록을 확인해 보세요.";
    } else {
      emptyState.querySelector("strong").textContent = "아직 기록이 없어요";
      emptyState.querySelector("span:last-of-type").textContent = "오늘의 마음을 첫 일기로 남겨 보세요.";
    }
  }

  // 전체 및 감정별 일기 개수를 만들고, 버튼 선택 시 해당 목록을 보여줍니다.
  function renderMoodCounts() {
    moodCounts.replaceChildren();
    moodCounts.append(createCountButton("전체", entries.length, activeMood === null, () => {
      activeMood = null;
      renderList();
    }));

    MOODS.forEach((mood) => {
      const count = entries.filter((entry) => entry.mood === mood.name).length;
      moodCounts.append(createCountButton(
        `${mood.icon} ${mood.name}`,
        count,
        activeMood === mood.name,
        () => {
          activeMood = mood.name;
          renderList();
        },
      ));
    });
  }

  renderList();
}

// 현재 선택 여부와 개수를 접근성 상태까지 포함한 감정 필터 버튼으로 만듭니다.
function createCountButton(label, count, isActive, onClick) {
  const button = document.createElement("button");
  button.className = "count-chip";
  button.type = "button";
  button.textContent = `${label} ${count}`;
  button.setAttribute("aria-pressed", String(isActive));
  button.addEventListener("click", onClick);
  return button;
}
