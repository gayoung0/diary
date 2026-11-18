// 작성·수정 화면이 함께 쓰는 순수 검증 함수로, 입력을 정리해 결과와 안내 문구를 돌려줍니다.
function validateDiaryInput({ mode, title, mood, content }) {
  const normalizedTitle = typeof title === "string" ? title.trim() : "";
  const normalizedContent = typeof content === "string" ? content.trim() : "";
  const hasMood = typeof mood === "string" && mood !== "";

  // 간단 모드에서는 내용을 생략할 수 있지만 일반 모드에서는 비어 있으면 안 됩니다.
  const valid = Boolean(
    normalizedTitle
    && hasMood
    && (mode !== "general" || normalizedContent),
  );

  return {
    valid,
    title: normalizedTitle,
    mood,
    content: normalizedContent,
    message: valid
      ? ""
      : mode === "general"
        ? "제목, 내용, 감정을 모두 입력해 주세요."
        : "제목과 감정을 선택해 주세요.",
  };
}
