function initializeTheme() {
  const toggle = document.querySelector("#theme-toggle");
  const icon = document.querySelector("#theme-icon");
  const label = document.querySelector("#theme-label");
  const status = document.querySelector("#theme-status");

  // 문서와 본문에 테마를 적용해 배경, 컴포넌트, 브라우저 탭 색을 함께 바꿉니다.
  function applyTheme(theme) {
    const isDark = theme === "dark";
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    document.body.dataset.theme = isDark ? "dark" : "light";
    icon.textContent = isDark ? "☀" : "☾";
    label.textContent = isDark ? "라이트 모드" : "다크 모드";
    toggle.setAttribute("aria-label", `${label.textContent}로 전환`);
    document.querySelector('meta[name="theme-color"]').content = isDark ? "#171d1a" : "#f7f5f0";
  }

  // 저장된 테마를 불러오고, 버튼을 누르면 화면과 저장 설정을 함께 전환합니다.
  let savedTheme = "light";
  try {
    savedTheme = localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch (error) {
    console.error("테마 설정을 불러오지 못했습니다.", error);
    status.textContent = "테마 설정을 불러오지 못했습니다.";
  }

  applyTheme(savedTheme);
  toggle.addEventListener("click", () => {
    const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      status.textContent = "";
    } catch (error) {
      console.error("테마 설정을 저장하지 못했습니다.", error);
      status.textContent = "테마는 변경했지만 설정을 저장하지 못했습니다.";
    }
  });
}
