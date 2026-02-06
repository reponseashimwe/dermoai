"use client";

const DB_NAME = "dermoai_offline";
const STORE_NAME = "pending_requests";

interface PendingRequest {
  id: string;
  url: string;
  method: string;
  body: string;
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queueRequest(
  url: string,
  method: string,
  body: string
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.add({
    id: crypto.randomUUID(),
    url,
    method,
    body,
    timestamp: Date.now(),
  });
}

export async function processQueue(): Promise<number> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);

  const items: PendingRequest[] = await new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  let processed = 0;
  for (const item of items) {
    try {
      await fetch(item.url, {
        method: item.method,
        body: item.body,
        headers: { "Content-Type": "application/json" },
      });
      // Remove from queue on success
      const deleteTx = db.transaction(STORE_NAME, "readwrite");
      deleteTx.objectStore(STORE_NAME).delete(item.id);
      processed++;
    } catch {
      // Keep in queue if still offline
      break;
    }
  }
  return processed;
}

// Auto-process queue when coming back online
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    processQueue();
  });
}
