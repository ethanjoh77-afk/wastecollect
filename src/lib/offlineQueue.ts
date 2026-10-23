// Foleni ya kazi za offline (malipo na usajili wa nyumba).
// Kazi zinahifadhiwa kwenye localStorage na kutumwa mtandao ukirudi.
// Kila kazi ina `id` (client_uuid) ili seva isidoublishe ikirudiwa.

export type QueueKind = 'payment' | 'property';

export interface QueueItem {
  id: string;
  kind: QueueKind;
  payload: Record<string, unknown>;
  label: string;
  created_at: string;
  attempts: number;
  /** Kosa la biashara kutoka seva (si la mtandao): kazi haitarudiwa tena kiotomatiki. */
  failed_reason?: string;
}

const KEY = 'wc_offline_queue_v1';
const EVENT = 'wc-offline-queue-changed';

function read(): QueueItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as QueueItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: QueueItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // localStorage imejaa/imezimwa — hakuna cha kufanya
  }
  window.dispatchEvent(new Event(EVENT));
}

export function newClientUuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function getQueue(): QueueItem[] {
  return read();
}

export function enqueue(item: Omit<QueueItem, 'created_at' | 'attempts'>) {
  const items = read();
  if (items.some((i) => i.id === item.id)) return;
  items.push({ ...item, created_at: new Date().toISOString(), attempts: 0 });
  write(items);
}

export function removeFromQueue(id: string) {
  write(read().filter((i) => i.id !== id));
}

export function updateQueueItem(id: string, patch: Partial<QueueItem>) {
  write(read().map((i) => (i.id === id ? { ...i, ...patch } : i)));
}

export function subscribeQueue(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

/** Kosa la mtandao (si la seva). */
export function isNetworkError(err: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  const e = err as { message?: string; code?: string; status?: number } | null;
  if (!e) return false;
  if (e.code && e.code !== '') return false; // Postgres/PostgREST error = ilifika kwenye seva
  if (typeof e.status === 'number' && e.status >= 400 && e.status < 500) return false;
  return /failed to fetch|networkerror|network request failed|load failed|timeout/i.test(e.message ?? '');
}
