function initializeDetailPage() {
  const diaryView = document.querySelector("#diary-view");
  const entryId = new URLSearchParams(window.location.search).get("id");
  const entry = entries.find((item) => item.id === entryId);

  if (!entry) {
    renderMissingEntry();
    return;
  }

  // 일기 내용을 표시하고, 같은 화면에서 수정·삭제 동작을 연결합니다.
  renderEntry();

  // 사용자 입력은 HTML이 아닌 텍스트로 넣어 원래 내용을 그대로 표시합니다.
  function renderEntry() {
    diaryView.replaceChildren();

    const heading = document.createElement("div");
    heading.className = "diary-page-heading";
    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = "YOUR MOMENT";
    const title = document.createElement("h1");
    title.className = "detail-title diary-page-title";
    title.textContent = entry.title;
    heading.append(eyebrow, title);

    const mood = MOODS.find((item) => item.name === entry.mood);
    const badge = document.createElement("span");
    badge.className = "detail-mood";
    badge.textContent = `${mood.icon} ${entry.mood}`;

    const metadata = document.createElement("p");
    metadata.className = "detail-date diary-page-date";
    metadata.textContent = `작성 ${formatDateTime(entry.createdAt)} · 수정 ${formatDateTime(entry.updatedAt)}`;

    const content = document.createElement("div");
    content.className = entry.content
      ? "detail-content diary-page-content"
      : "detail-content diary-page-content detail-empty-content";
    content.textContent = entry.content || "내용 없이 간단하게 기록한 일기예요.";

    const mode = document.createElement("p");
    mode.className = "detail-mode";
    mode.textContent = entry.mode === "simple" ? "간단 모드로 작성" : "일반 모드로 작성";

    const actions = document.createElement("div");
    actions.className = "detail-actions";
    const editButton = document.createElement("button");
    editButton.className = "secondary-button";
    editButton.type = "button";
    editButton.textContent = "수정하기";
    editButton.addEventListener("click", renderEditForm);
    const deleteButton = document.createElement("button");
    deleteButton.className = "danger-button";
    deleteButton.type = "button";
    deleteButton.textContent = "삭제하기";
    deleteButton.addEventListener("click", deleteEntry);
    actions.append(editButton, deleteButton);

    diaryView.append(heading, badge, metadata, content, mode, actions);
  }

  // 선택한 일기의 입력 폼을 만들고 저장 시 공통 규칙으로 검증합니다.
  function renderEditForm() {
    diaryView.replaceChildren();

    const heading = document.createElement("div");
    heading.className = "panel-heading";
    const title = document.createElement("h1");
    title.className = "panel-title";
    title.textContent = "일기 수정";
    heading.append(title);

    const form = document.createElement("form");
    form.className = "edit-form";
    const titleField = createTextField("수정할 제목", "edit-title", entry.title, 60);
    const moodField = document.createElement("fieldset");
    moodField.className = "form-field mood-fieldset";
    const moodLegend = document.createElement("legend");
    moodLegend.textContent = "오늘의 감정";
    const moodChoices = document.createElement("div");
    moodChoices.className = "mood-options";
    moodChoices.id = "edit-mood-options";
    moodField.append(moodLegend, moodChoices);
    renderMoodOptions(moodChoices, entry.mood);

    const contentField = document.createElement("div");
    contentField.className = "form-field";
    const contentLabel = document.createElement("label");
    contentLabel.htmlFor = "edit-content";
    contentLabel.textContent = `내용${entry.mode === "general" ? " (필수)" : " (선택)"}`;
    const contentInput = document.createElement("textarea");
    contentInput.id = "edit-content";
    contentInput.rows = 16;
    contentInput.maxLength = 2000;
    contentInput.value = entry.content;
    contentInput.required = entry.mode === "general";
    contentInput.placeholder = "오늘의 마음을 적어 보세요.";
    contentField.append(contentLabel, contentInput);

    const message = document.createElement("p");
    message.className = "form-message";
    message.setAttribute("role", "status");
    message.setAttribute("aria-live", "polite");

    const actions = document.createElement("div");
    actions.className = "detail-actions";
    const saveButton = document.createElement("button");
    saveButton.className = "primary-button edit-save-button";
    saveButton.type = "submit";
    saveButton.textContent = "수정 내용 저장";
    const cancelButton = document.createElement("button");
    cancelButton.className = "secondary-button";
    cancelButton.type = "button";
    cancelButton.textContent = "취소";
    cancelButton.addEventListener("click", renderEntry);
    actions.append(saveButton, cancelButton);

    form.append(titleField, moodField, contentField, message, actions);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const titleValue = form.querySelector("#edit-title").value;
      const moodValue = form.querySelector('input[name="mood"]:checked')?.value;
      const validation = validateDiaryInput({
        mode: entry.mode,
        title: titleValue,
        mood: moodValue,
        content: contentInput.value,
      });

      // 유효한 경우에만 기존 항목을 교체하고 수정 시각을 갱신합니다.
      if (!validation.valid) {
        message.textContent = validation.message;
        return;
      }

      const updatedEntry = {
        ...entry,
        title: validation.title,
        content: validation.content,
        mood: validation.mood,
        updatedAt: new Date().toISOString(),
      };
      const nextEntries = entries.map((item) => item.id === entry.id ? updatedEntry : item);
      if (!saveEntries(nextEntries)) {
        message.textContent = getStorageWriteErrorMessage("수정");
        return;
      }
      Object.assign(entry, updatedEntry);
      renderEntry();
    });

    diaryView.append(heading, form);
    form.querySelector("#edit-title").focus();
  }

  // 삭제 확인을 받은 뒤 저장소에서 해당 ID의 일기만 제거합니다.
  function deleteEntry() {
    if (!window.confirm("이 일기를 삭제할까요? 삭제한 일기는 되돌릴 수 없습니다.")) return;
    const nextEntries = entries.filter((item) => item.id !== entry.id);
    if (!saveEntries(nextEntries)) {
      window.alert(getStorageWriteErrorMessage("삭제"));
      return;
    }
    window.location.href = "index.html";
  }
}

// 상세 수정 폼에서 라벨과 텍스트 입력 요소를 함께 생성합니다.
function createTextField(labelText, id, value, maxLength) {
  const field = document.createElement("div");
  field.className = "form-field";
  const label = document.createElement("label");
  label.htmlFor = id;
  label.textContent = labelText;
  const input = document.createElement("input");
  input.id = id;
  input.type = "text";
  input.maxLength = maxLength;
  input.value = value;
  input.required = true;
  field.append(label, input);
  return field;
}

// ID에 해당하는 일기가 없을 때 목록으로 돌아갈 수 있는 안내를 표시합니다.
function renderMissingEntry() {
  const diaryView = document.querySelector("#diary-view");
  const message = document.createElement("div");
  message.className = "missing-entry";
  const title = document.createElement("h1");
  title.textContent = "일기를 찾을 수 없어요";
  const description = document.createElement("p");
  description.textContent = "목록으로 돌아가 다른 일기를 선택해 주세요.";
  const link = document.createElement("a");
  link.className = "primary-link";
  link.href = "index.html";
  link.textContent = "일기 목록으로";
  message.append(title, description, link);
  diaryView.append(message);
}
