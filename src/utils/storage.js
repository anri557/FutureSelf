const KEY = "futureself_messages";

export function loadMessages() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw).map((m) => ({
      ...m,
      openDate: new Date(m.openDate),
    }));
  } catch {
    return [];
  }
}

export function saveMessages(messages) {
  localStorage.setItem(KEY, JSON.stringify(messages));
}