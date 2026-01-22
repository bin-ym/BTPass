/**
 * Offline storage utilities using IndexedDB
 * Stores scan logs locally when offline, syncs when online
 */

export interface OfflineScanLog {
  id: string;
  invitation_id: string | null;
  usher_id: string | null;
  scanned_at: string;
  admit_count: number | null;
  result: "ADMIT" | "REJECT" | null;
  mode: "ONLINE" | "OFFLINE";
  synced: boolean;
  guest_name?: string;
  guest_phone?: string;
  group_size?: number;
}

const DB_NAME = "btpass_usher_db";
const DB_VERSION = 1;
const STORE_NAME = "scan_logs";

let db: IDBDatabase | null = null;

/**
 * Initialize IndexedDB
 */
export async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = database.createObjectStore(STORE_NAME, {
          keyPath: "id",
        });
        objectStore.createIndex("synced", "synced", { unique: false });
        objectStore.createIndex("scanned_at", "scanned_at", { unique: false });
      }
    };
  });
}

/**
 * Save scan log to offline storage
 */
export async function saveOfflineScan(scan: OfflineScanLog): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(scan);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all unsynced scans
 */
export async function getUnsyncedScans(): Promise<OfflineScanLog[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("synced");
    const request = index.getAll(false);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Mark scan as synced
 */
export async function markScanAsSynced(scanId: string): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(scanId);

    getRequest.onsuccess = () => {
      const scan = getRequest.result;
      if (scan) {
        scan.synced = true;
        const putRequest = store.put(scan);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Get all scans (for local history)
 */
export async function getAllOfflineScans(): Promise<OfflineScanLog[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all synced scans (cleanup)
 */
export async function clearSyncedScans(): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("synced");
    const request = index.openCursor(IDBKeyRange.only(true));

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });
}
