function validateDiaryInput({ mode, title, mood, content }) {
  const normalizedTitle = typeof title === "string" ? title.trim() : "";
  const normalizedContent = typeof content === "string" ? content.trim() : "";
  const hasMood = typeof mood === "string" && mood !== "";
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
