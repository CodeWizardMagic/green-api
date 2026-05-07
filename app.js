const STORAGE_KEY = "green-api-demo-state";
const DEFAULT_API_URL = "https://api.green-api.com";
const LEGACY_API_URL = "https://api.greenapi.com";

const elements = {
  credentialsForm: document.getElementById("credentialsForm"),
  sendMessageForm: document.getElementById("sendMessageForm"),
  sendFileForm: document.getElementById("sendFileForm"),
  idInstance: document.getElementById("idInstance"),
  apiTokenInstance: document.getElementById("apiTokenInstance"),
  apiUrl: document.getElementById("apiUrl"),
  messageChatId: document.getElementById("messageChatId"),
  messageText: document.getElementById("messageText"),
  quotedMessageId: document.getElementById("quotedMessageId"),
  linkPreview: document.getElementById("linkPreview"),
  typePreview: document.getElementById("typePreview"),
  typingTime: document.getElementById("typingTime"),
  customPreviewTitle: document.getElementById("customPreviewTitle"),
  customPreviewDescription: document.getElementById("customPreviewDescription"),
  customPreviewLink: document.getElementById("customPreviewLink"),
  customPreviewUrlFile: document.getElementById("customPreviewUrlFile"),
  customPreviewJpegThumbnail: document.getElementById("customPreviewJpegThumbnail"),
  fileChatId: document.getElementById("fileChatId"),
  urlFile: document.getElementById("urlFile"),
  fileName: document.getElementById("fileName"),
  caption: document.getElementById("caption"),
  fileQuotedMessageId: document.getElementById("fileQuotedMessageId"),
  fileTypingTime: document.getElementById("fileTypingTime"),
  typingType: document.getElementById("typingType"),
  responseOutput: document.getElementById("responseOutput"),
  responseMeta: document.getElementById("responseMeta"),
  connectionBadge: document.getElementById("connectionBadge"),
  clearResponseButton: document.getElementById("clearResponseButton"),
  actionButtons: Array.from(document.querySelectorAll("[data-action]"))
};

loadSavedState();
bindEvents();
refreshConnectionBadge();

function bindEvents() {
  const persistTargets = [
    elements.idInstance,
    elements.apiTokenInstance,
    elements.apiUrl,
    elements.messageChatId,
    elements.messageText,
    elements.quotedMessageId,
    elements.linkPreview,
    elements.typePreview,
    elements.typingTime,
    elements.customPreviewTitle,
    elements.customPreviewDescription,
    elements.customPreviewLink,
    elements.customPreviewUrlFile,
    elements.customPreviewJpegThumbnail,
    elements.fileChatId,
    elements.urlFile,
    elements.fileName,
    elements.caption
    ,
    elements.fileQuotedMessageId,
    elements.fileTypingTime,
    elements.typingType
  ];

  persistTargets.forEach((element) => {
    const syncState = () => {
      if (element === elements.idInstance) {
        syncSuggestedApiUrl();
      }
      saveState();
      refreshConnectionBadge();
    };

    element.addEventListener("input", syncState);
    element.addEventListener("change", syncState);
  });

  elements.actionButtons.forEach((button) => {
    const action = button.dataset.action;
    if (action === "getSettings" || action === "getStateInstance") {
      button.addEventListener("click", () => {
        handleSimpleAction(action);
      });
    }
  });

  elements.sendMessageForm.addEventListener("submit", (event) => {
    event.preventDefault();
    handleSendMessage();
  });

  elements.sendFileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    handleSendFileByUrl();
  });

  elements.clearResponseButton.addEventListener("click", () => {
    elements.responseOutput.value = "Ожидание запроса...";
    elements.responseMeta.innerHTML = "<span>Поле ответа очищено</span>";
  });
}

async function handleSimpleAction(action) {
  const credentials = getCredentials();
  if (!credentials) {
    return;
  }

  await executeRequest({
    action,
    method: action,
    requestMethod: "GET"
  });
}

async function handleSendMessage() {
  const credentials = getCredentials();
  if (!credentials) {
    return;
  }

  const chatId = normalizeChatId(elements.messageChatId.value);
  const message = elements.messageText.value.trim();
  const quotedMessageId = elements.quotedMessageId.value.trim();
  const typePreview = elements.typePreview.value.trim();
  const typingTime = parseTypingTime(elements.typingTime.value);
  const customPreview = buildCustomPreview();

  if (!chatId || !message) {
    showValidationError("Для sendMessage заполните chatId и текст сообщения.");
    return;
  }

  if (message.length > 20000) {
    showValidationError("Текст сообщения должен быть меньше или равен 20000 символам.");
    return;
  }

  if (typingTime === null) {
    showValidationError("typingTime должен быть в диапазоне от 1000 до 20000 миллисекунд.");
    return;
  }

  if (customPreview === false) {
    showValidationError("Для customPreview обязательно укажите заголовок превью.");
    return;
  }

  elements.messageChatId.value = chatId;
  saveState();

  const body = {
    chatId,
    message,
    ...(quotedMessageId ? { quotedMessageId } : {}),
    ...(elements.linkPreview.checked === false ? { linkPreview: false } : {}),
    ...(typePreview ? { typePreview } : {}),
    ...(typingTime !== undefined ? { typingTime } : {}),
    ...(customPreview ? { customPreview } : {})
  };

  await executeRequest({
    action: "sendMessage",
    method: "sendMessage",
    requestMethod: "POST",
    body
  });
}

async function handleSendFileByUrl() {
  const credentials = getCredentials();
  if (!credentials) {
    return;
  }

  const chatId = normalizeChatId(elements.fileChatId.value);
  const urlFile = elements.urlFile.value.trim();
  const fileName = resolveFileName(elements.fileName.value, urlFile);
  const caption = elements.caption.value.trim();
  const quotedMessageId = elements.fileQuotedMessageId.value.trim();
  const typingTime = parseTypingTime(elements.fileTypingTime.value);
  const typingType = elements.typingType.value.trim();

  if (!chatId || !urlFile || !fileName) {
    showValidationError("Для sendFileByUrl заполните chatId, URL файла и имя файла.");
    return;
  }

  if (!isHttpUrl(urlFile)) {
    showValidationError("urlFile должен начинаться с http:// или https:// и указывать на прямую ссылку на файл.");
    return;
  }

  if (!hasFileExtension(fileName)) {
    showValidationError("fileName должен содержать корректное расширение файла, например report.pdf.");
    return;
  }

  if (caption.length > 20000) {
    showValidationError("Подпись к файлу должна быть меньше или равна 20000 символам.");
    return;
  }

  if (typingTime === null) {
    showValidationError("typingTime должен быть в диапазоне от 1000 до 20000 миллисекунд.");
    return;
  }

  elements.fileChatId.value = chatId;
  elements.fileName.value = fileName;
  saveState();

  await executeRequest({
    action: "sendFileByUrl",
    method: "sendFileByUrl",
    requestMethod: "POST",
    body: {
      chatId,
      urlFile,
      fileName,
      ...(caption ? { caption } : {}),
      ...(quotedMessageId ? { quotedMessageId } : {}),
      ...(typingTime !== undefined ? { typingTime } : {}),
      ...(typingType ? { typingType } : {})
    }
  });
}

async function executeRequest({ action, method, requestMethod, body }) {
  const credentials = getCredentials();
  if (!credentials) {
    return;
  }

  const endpoint = buildEndpoint(credentials.apiUrl, credentials.idInstance, credentials.apiTokenInstance, method);
  const startedAt = performance.now();
  setPendingState(true, action);
  renderResponseMeta(`Выполняется ${action}...`);

  try {
    const response = await fetch(endpoint, {
      method: requestMethod,
      headers: {
        "Content-Type": "application/json"
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });

    const parsedBody = await parseResponse(response);
    const duration = Math.round(performance.now() - startedAt);

    renderResponseMeta(
      [
        `Метод: ${action}`,
        `HTTP: ${response.status} ${response.statusText || ""}`.trim(),
        `Время: ${duration} мс`
      ].join("  |  ")
    );

    elements.responseOutput.value = JSON.stringify(
      {
        request: {
          endpoint,
          method: requestMethod,
          ...(body ? { body } : {})
        },
        response: parsedBody
      },
      null,
      2
    );
  } catch (error) {
    renderResponseMeta(`Ошибка при вызове ${action}`);
    elements.responseOutput.value = JSON.stringify(
      {
        error: error.message,
        hint: "Проверьте idInstance, ApiTokenInstance, API URL и доступность сети."
      },
      null,
      2
    );
  } finally {
    setPendingState(false);
  }
}

function getCredentials() {
  const idInstance = elements.idInstance.value.trim();
  const apiTokenInstance = elements.apiTokenInstance.value.trim();
  const apiUrl = resolveApiUrl(elements.apiUrl.value, idInstance);

  if (!idInstance || !apiTokenInstance) {
    showValidationError("Сначала заполните idInstance и ApiTokenInstance.");
    return null;
  }

  elements.apiUrl.value = apiUrl;
  saveState();
  refreshConnectionBadge();

  return {
    idInstance,
    apiTokenInstance,
    apiUrl
  };
}

function buildEndpoint(apiUrl, idInstance, apiTokenInstance, method) {
  return `${apiUrl}/waInstance${encodeURIComponent(idInstance)}/${method}/${encodeURIComponent(apiTokenInstance)}`;
}

function normalizeApiUrl(value) {
  return value.trim().replace(/\/+$/, "");
}

function normalizeChatId(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (/@(c\.us|g\.us|lid)$/i.test(trimmed)) {
    return trimmed;
  }

  const digitsOnly = trimmed.replace(/[^\d]/g, "");
  return digitsOnly ? `${digitsOnly}@c.us` : trimmed;
}

function parseTypingTime(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 1000 || parsed > 20000) {
    return null;
  }

  return parsed;
}

function buildCustomPreview() {
  const title = elements.customPreviewTitle.value.trim();
  const description = elements.customPreviewDescription.value.trim();
  const link = elements.customPreviewLink.value.trim();
  const urlFile = elements.customPreviewUrlFile.value.trim();
  const jpegThumbnail = elements.customPreviewJpegThumbnail.value.trim();

  const hasCustomPreviewData = Boolean(title || description || link || urlFile || jpegThumbnail);
  if (!hasCustomPreviewData) {
    return undefined;
  }

  if (!title) {
    return false;
  }

  return {
    title,
    ...(description ? { description } : {}),
    ...(link ? { link } : {}),
    ...(urlFile ? { urlFile } : {}),
    ...(jpegThumbnail ? { jpegThumbnail } : {})
  };
}

function resolveFileName(explicitFileName, urlFile) {
  const trimmedFileName = explicitFileName.trim();
  if (trimmedFileName) {
    return trimmedFileName;
  }

  try {
    const parsedUrl = new URL(urlFile);
    const lastSegment = parsedUrl.pathname.split("/").filter(Boolean).pop();
    return lastSegment || "";
  } catch {
    return "";
  }
}

function hasFileExtension(fileName) {
  return /\.[A-Za-z0-9]{1,16}$/.test(fileName.trim());
}

function isHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

async function parseResponse(response) {
  const rawText = await response.text();
  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return rawText;
  }
}

function showValidationError(message) {
  renderResponseMeta("Ошибка валидации");
  elements.responseOutput.value = JSON.stringify(
    {
      error: message
    },
    null,
    2
  );
}

function setPendingState(isPending, activeAction = "") {
  elements.actionButtons.forEach((button) => {
    button.disabled = isPending;
    button.textContent = isPending && button.dataset.action === activeAction
      ? "Выполняется..."
      : getDefaultButtonLabel(button.dataset.action);
  });

  elements.clearResponseButton.disabled = isPending;
}

function getDefaultButtonLabel(action) {
  switch (action) {
    case "getSettings":
      return "Выполнить getSettings";
    case "getStateInstance":
      return "Выполнить getStateInstance";
    case "sendMessage":
      return "Отправить сообщение";
    case "sendFileByUrl":
      return "Отправить файл";
    default:
      return "Выполнить";
  }
}

function renderResponseMeta(text) {
  elements.responseMeta.innerHTML = `<span>${escapeHtml(text)}</span>`;
}

function refreshConnectionBadge() {
  const hasCredentials = Boolean(
    elements.idInstance.value.trim() && elements.apiTokenInstance.value.trim()
  );

  elements.connectionBadge.textContent = hasCredentials ? "Данные заполнены" : "Не подключено";
}

function loadSavedState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    elements.idInstance.value = saved.idInstance || "";
    elements.apiTokenInstance.value = saved.apiTokenInstance || "";
    elements.apiUrl.value = saved.apiUrl || "";
    elements.messageChatId.value = saved.messageChatId || "";
    elements.messageText.value = saved.messageText || "";
    elements.quotedMessageId.value = saved.quotedMessageId || "";
    elements.linkPreview.checked = saved.linkPreview !== false;
    elements.typePreview.value = saved.typePreview || "";
    elements.typingTime.value = saved.typingTime || "";
    elements.customPreviewTitle.value = saved.customPreviewTitle || "";
    elements.customPreviewDescription.value = saved.customPreviewDescription || "";
    elements.customPreviewLink.value = saved.customPreviewLink || "";
    elements.customPreviewUrlFile.value = saved.customPreviewUrlFile || "";
    elements.customPreviewJpegThumbnail.value = saved.customPreviewJpegThumbnail || "";
    elements.fileChatId.value = saved.fileChatId || "";
    elements.urlFile.value = saved.urlFile || "";
    elements.fileName.value = saved.fileName || "";
    elements.caption.value = saved.caption || "";
    elements.fileQuotedMessageId.value = saved.fileQuotedMessageId || "";
    elements.fileTypingTime.value = saved.fileTypingTime || "";
    elements.typingType.value = saved.typingType || "";
  } catch {
    elements.apiUrl.value = "";
  }
}

function saveState() {
  const state = {
    idInstance: elements.idInstance.value.trim(),
    apiTokenInstance: elements.apiTokenInstance.value.trim(),
    apiUrl: normalizeApiUrl(elements.apiUrl.value),
    messageChatId: elements.messageChatId.value.trim(),
    messageText: elements.messageText.value,
    quotedMessageId: elements.quotedMessageId.value.trim(),
    linkPreview: elements.linkPreview.checked,
    typePreview: elements.typePreview.value,
    typingTime: elements.typingTime.value.trim(),
    customPreviewTitle: elements.customPreviewTitle.value.trim(),
    customPreviewDescription: elements.customPreviewDescription.value.trim(),
    customPreviewLink: elements.customPreviewLink.value.trim(),
    customPreviewUrlFile: elements.customPreviewUrlFile.value.trim(),
    customPreviewJpegThumbnail: elements.customPreviewJpegThumbnail.value.trim(),
    fileChatId: elements.fileChatId.value.trim(),
    urlFile: elements.urlFile.value.trim(),
    fileName: elements.fileName.value.trim(),
    caption: elements.caption.value
    ,
    fileQuotedMessageId: elements.fileQuotedMessageId.value.trim(),
    fileTypingTime: elements.fileTypingTime.value.trim(),
    typingType: elements.typingType.value
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function syncSuggestedApiUrl() {
  const currentValue = normalizeApiUrl(elements.apiUrl.value);
  const suggestedValue = resolveApiUrl(currentValue, elements.idInstance.value.trim());
  const defaultValues = ["", DEFAULT_API_URL, LEGACY_API_URL];

  if (defaultValues.includes(currentValue)) {
    elements.apiUrl.value = suggestedValue;
  }
}

function resolveApiUrl(rawValue, idInstance) {
  const trimmed = normalizeApiUrl(rawValue);
  const defaultUrl = idInstance.startsWith("7103") ? LEGACY_API_URL : DEFAULT_API_URL;

  if (!trimmed) {
    return defaultUrl;
  }

  if (trimmed === DEFAULT_API_URL || trimmed === LEGACY_API_URL) {
    return defaultUrl;
  }

  return trimmed;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
