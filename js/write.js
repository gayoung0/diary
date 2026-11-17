function initializeWritePage() {
  const form = document.querySelector("#diary-form");
  const modeInputs = document.querySelectorAll('input[name="mode"]');
  const simpleTitleSelect = document.querySelector("#simple-title");
  const simpleCustomTitle = document.querySelector("#simple-custom-title");
  const generalTitleInput = document.querySelector("#general-title");
  const contentInput = document.querySelector("#diary-content");
  const formMessage = document.querySelector("#form-message");
  const moodOptions = document.querySelector("#mood-options");
  const contentRequirement = document.querySelector("#content-requirement");
  const draftStatus = document.querySelector("#draft-status");

  renderMoodOptions(moodOptions);
  restoreDraft();
  modeInputs.forEach((input) => input.addEventListener("change", () => {
    updateModeFields();
    saveDraft();
  }));
  simpleTitleSelect.addEventListener("change", () => {
    const isCustomTitle = simpleTitleSelect.value === "직접 입력";
    simpleCustomTitle.hidden = !isCustomTitle;
    if (isCustomTitle) simpleCustomTitle.focus();
    saveDraft();
  });
  form.addEventListener("input", saveDraft);
  form.addEventListener("change", saveDraft);
  form.addEventListener("submit", saveNewEntry);

  function restoreDraft() {
    let draft;
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved === null) return;

      draft = JSON.parse(saved);
      if (!isDiaryDraft(draft)) {
        throw new Error("임시 저장 데이터의 형식이 올바르지 않습니다.");
      }
    } catch (error) {
      console.error("임시 저장 내용을 불러오지 못했습니다.", error);
      draftStatus.textContent = "임시 저장 내용을 불러오지 못했습니다.";
      draftStatus.classList.add("draft-status-error");
      return;
    }

    form.querySelector(`input[name="mode"][value="${draft.mode}"]`).checked = true;
    simpleTitleSelect.value = draft.simpleTitle;
    simpleCustomTitle.value = draft.simpleCustomTitle;
    generalTitleInput.value = draft.generalTitle;
    contentInput.value = draft.content;
    if (draft.mood) {
      const moodInput = form.querySelector(`input[name="mood"][value="${draft.mood}"]`);
      if (moodInput) moodInput.checked = true;
    }
    updateModeFields();
    simpleCustomTitle.hidden = simpleTitleSelect.value !== "직접 입력";

    const savedAt = new Date(draft.savedAt);
    const timeLabel = Number.isNaN(savedAt.getTime())
      ? ""
      : ` (${new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit" }).format(savedAt)})`;
    draftStatus.textContent = `임시 저장한 내용을 불러왔어요${timeLabel}. 입력하면 자동 저장됩니다.`;
  }

  function saveDraft() {
    const draft = {
      mode: getSelectedMode(form),
      simpleTitle: simpleTitleSelect.value,
      simpleCustomTitle: simpleCustomTitle.value,
      generalTitle: generalTitleInput.value,
      mood: form.querySelector('input[name="mood"]:checked')?.value ?? "",
      content: contentInput.value,
      savedAt: new Date().toISOString(),
    };

    const hasContent = draft.mode !== "simple"
      || draft.simpleTitle !== ""
      || draft.simpleCustomTitle.trim() !== ""
      || draft.generalTitle.trim() !== ""
      || draft.mood !== ""
      || draft.content.trim() !== "";

    try {
      if (hasContent) {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
        draftStatus.textContent = "임시 저장됨 · 입력 내용이 자동으로 저장돼요.";
        draftStatus.classList.remove("draft-status-error");
      } else {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        draftStatus.textContent = "작성 내용은 자동으로 임시 저장됩니다.";
      }
    } catch (error) {
      console.error("임시 저장 내용을 저장하지 못했습니다.", error);
      draftStatus.textContent = "임시 저장에 실패했어요. 브라우저 저장 공간을 확인해 주세요.";
      draftStatus.classList.add("draft-status-error");
    }
  }

  function updateModeFields() {
    const mode = getSelectedMode(form);
    document.querySelector("#simple-title-field").hidden = mode !== "simple";
    document.querySelector("#general-title-field").hidden = mode !== "general";
    contentRequirement.textContent = mode === "general" ? "(필수)" : "(선택)";
    contentInput.required = mode === "general";
    formMessage.textContent = "";
  }

  function saveNewEntry(event) {
    event.preventDefault();
    formMessage.textContent = "";

    const mode = getSelectedMode(form);
    const mood = form.querySelector('input[name="mood"]:checked')?.value;
    const title = (mode === "general"
      ? generalTitleInput.value
      : simpleTitleSelect.value === "직접 입력"
        ? simpleCustomTitle.value
        : simpleTitleSelect.value).trim();
    const content = contentInput.value.trim();

    if (!title || !mood || (mode === "general" && !content)) {
      formMessage.textContent = mode === "general"
        ? "제목, 내용, 감정을 모두 입력해 주세요."
        : "제목과 감정을 선택해 주세요.";
      return;
    }

    const now = new Date().toISOString();
    const entry = {
      id: createId(),
      mode,
      title,
      content,
      mood,
      createdAt: now,
      updatedAt: now,
    };

    if (!saveEntries([entry, ...entries])) {
      formMessage.textContent = "저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.";
      return;
    }
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (error) {
      console.error("저장한 일기의 임시 초안을 정리하지 못했습니다.", error);
    }
    window.location.href = `diary.html?id=${encodeURIComponent(entry.id)}`;
  }
}

function isDiaryDraft(value) {
  return value !== null
    && typeof value === "object"
    && (value.mode === "simple" || value.mode === "general")
    && typeof value.simpleTitle === "string"
    && typeof value.simpleCustomTitle === "string"
    && typeof value.generalTitle === "string"
    && (value.mood === "" || MOODS.some((mood) => mood.name === value.mood))
    && typeof value.content === "string"
    && typeof value.savedAt === "string";
}

function renderMoodOptions(container, selectedMood = null) {
  container.replaceChildren();
  MOODS.forEach((mood, index) => {
    const label = document.createElement("label");
    label.className = "mood-option";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "mood";
    input.value = mood.name;
    input.required = index === 0;
    input.checked = mood.name === selectedMood;

    const text = document.createElement("span");
    text.textContent = `${mood.icon} ${mood.name}`;
    label.append(input, text);
    container.append(label);
  });
}

function getSelectedMode(form) {
  return form.querySelector('input[name="mode"]:checked').value;
}
