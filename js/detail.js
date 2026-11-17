function initializeDetailPage() {
  const diaryView = document.querySelector("#diary-view");
  const entryId = new URLSearchParams(window.location.search).get("id");
  const entry = entries.find((item) => item.id === entryId);

  if (!entry) {
    renderMissingEntry();
    return;
  }

  renderEntry();

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
      const titleValue = form.querySelector("#edit-title").value.trim();
      const contentValue = contentInput.value.trim();
      const moodValue = form.querySelector('input[name="mood"]:checked')?.value;

      if (!titleValue || !moodValue || (entry.mode === "general" && !contentValue)) {
        message.textContent = entry.mode === "general"
          ? "제목, 내용, 감정을 모두 입력해 주세요."
          : "제목과 감정을 선택해 주세요.";
        return;
      }

      const updatedEntry = {
        ...entry,
        title: titleValue,
        content: contentValue,
        mood: moodValue,
        updatedAt: new Date().toISOString(),
      };
      const nextEntries = entries.map((item) => item.id === entry.id ? updatedEntry : item);
      if (!saveEntries(nextEntries)) {
        message.textContent = "수정 내용을 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.";
        return;
      }
      Object.assign(entry, updatedEntry);
      renderEntry();
    });

    diaryView.append(heading, form);
    form.querySelector("#edit-title").focus();
  }

  function deleteEntry() {
    if (!window.confirm("이 일기를 삭제할까요? 삭제한 일기는 되돌릴 수 없습니다.")) return;
    const nextEntries = entries.filter((item) => item.id !== entry.id);
    if (!saveEntries(nextEntries)) {
      window.alert("일기를 삭제하지 못했어요. 브라우저 저장 공간을 확인해 주세요.");
      return;
    }
    window.location.href = "index.html";
  }
}

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
