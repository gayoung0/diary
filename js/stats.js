function initializeStatsPage() {
  const total = entries.length;
  const totalLabel = document.querySelector("#stats-total");
  const chartContent = document.querySelector("#mood-chart-content");
  const emptyState = document.querySelector("#stats-empty");
  const chart = document.querySelector("#mood-pie-chart");
  const legend = document.querySelector("#mood-legend");
  const weeklyChart = document.querySelector("#weekly-chart");
  const weeklyEmptyState = document.querySelector("#weekly-stats-empty");
  const counts = MOODS.map((mood) => ({
    ...mood,
    count: entries.filter((entry) => entry.mood === mood.name).length,
  }));

  totalLabel.textContent = `총 ${total}개`;
  emptyState.hidden = total > 0;
  chartContent.hidden = total === 0;

  if (total > 0) {
    // 감정 개수를 누적 각도로 바꿔 원형 그래프의 각 구간을 만듭니다.
    let currentAngle = 0;
    const segments = counts
      .filter((mood) => mood.count > 0)
      .map((mood) => {
        const startAngle = currentAngle;
        currentAngle += (mood.count / total) * 360;
        return `${mood.color} ${startAngle}deg ${currentAngle}deg`;
      });

    chart.style.background = `conic-gradient(${segments.join(", ")})`;
    chart.setAttribute(
      "aria-label",
      counts
        .filter((mood) => mood.count > 0)
        .map((mood) => `${mood.name} ${Math.round((mood.count / total) * 100)}%`)
        .join(", "),
    );
    legend.replaceChildren();

    counts.forEach((mood) => {
      const percentage = (mood.count / total) * 100;
      const item = document.createElement("li");
      item.className = "mood-legend-item";

      const label = document.createElement("span");
      label.className = "mood-legend-label";
      const dot = document.createElement("span");
      dot.className = "mood-legend-dot";
      dot.style.backgroundColor = mood.color;
      dot.setAttribute("aria-hidden", "true");
      const name = document.createElement("span");
      name.textContent = `${mood.icon} ${mood.name}`;
      label.append(dot, name);

      const value = document.createElement("span");
      value.className = "mood-legend-value";
      value.textContent = `${percentage.toFixed(percentage % 1 === 0 ? 0 : 1)}% · ${mood.count}개`;
      item.append(label, value);
      legend.append(item);
    });
  }

  // 통계 페이지에 들어올 때 저장된 일기를 기준으로 최근 4주를 다시 계산합니다.
  const weeklyData = getWeeklyWritingDays(entries, new Date());
  renderWeeklyWritingChart(weeklyChart, weeklyEmptyState, weeklyData, total > 0);
}

// 기준 날짜가 속한 주까지 최근 4주를 월요일 시작 기준으로 계산합니다.
function getWeeklyWritingDays(diaryEntries, referenceDate) {
  const reference = new Date(referenceDate);
  if (Number.isNaN(reference.getTime())) {
    throw new TypeError("기준 날짜가 올바르지 않습니다.");
  }

  const currentWeekStart = new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate() - ((reference.getDay() + 6) % 7),
  );
  const weeks = Array.from({ length: 4 }, (_, index) => {
    const start = new Date(currentWeekStart);
    start.setDate(currentWeekStart.getDate() - (3 - index) * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end, recordedDates: new Set() };
  });

  // 작성 시각을 기기의 현지 날짜로 바꾸고, 같은 날의 여러 일기는 한 번만 셉니다.
  diaryEntries.forEach((entry) => {
    const createdAt = new Date(entry.createdAt);
    if (Number.isNaN(createdAt.getTime())) return;

    const localDate = new Date(
      createdAt.getFullYear(),
      createdAt.getMonth(),
      createdAt.getDate(),
    );
    const week = weeks.find(({ start, end }) => localDate >= start && localDate <= end);
    if (week) week.recordedDates.add(formatLocalDateKey(localDate));
  });

  return weeks.map(({ start, end, recordedDates }) => ({
    start,
    end,
    days: Math.min(recordedDates.size, 7),
  }));
}

// UTC 변환 없이 기기의 현지 연·월·일로 중복 날짜를 판별합니다.
function formatLocalDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function renderWeeklyWritingChart(container, emptyState, weeks, hasEntries) {
  container.replaceChildren();
  emptyState.hidden = hasEntries;

  // 기록이 없는 주도 0일 막대로 표시해 최근 4주를 빠짐없이 보여줍니다.
  weeks.forEach((week) => {
    const item = document.createElement("div");
    item.className = "weekly-chart-item";
    item.setAttribute("role", "listitem");

    const value = document.createElement("span");
    value.className = "weekly-chart-value";
    value.textContent = `${week.days}일`;

    const track = document.createElement("div");
    track.className = "weekly-chart-track";
    track.setAttribute("aria-hidden", "true");
    const bar = document.createElement("div");
    bar.className = "weekly-chart-bar";
    bar.style.height = `${(week.days / 7) * 100}%`;
    track.append(bar);

    const range = document.createElement("span");
    range.className = "weekly-chart-range";
    range.textContent = `${formatWeekDate(week.start)}–${formatWeekDate(week.end)}`;

    const accessibleLabel = document.createElement("span");
    accessibleLabel.className = "visually-hidden";
    accessibleLabel.textContent = `${formatWeekDate(week.start)}부터 ${formatWeekDate(week.end)}까지 ${week.days}일 작성`;

    item.append(value, track, range, accessibleLabel);
    container.append(item);
  });
}

function formatWeekDate(date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
