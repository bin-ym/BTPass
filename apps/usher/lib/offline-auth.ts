/**
 * Offline authentication utilities
 * Stores user credentials and session data in IndexedDB for offline access
 */

const DB_NAME = "btpass_usher_auth";
const DB_VERSION = 1;
const STORE_NAME = "auth_data";
const SESSION_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

let db: IDBDatabase | null = null;

export interface OfflineUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: "USHER";
  passwordHash: string;
  lastLogin: string;
}

export interface OfflineSession {
  userId: string;
  userName: string;
  userEmail: string | null;
  userPhone: string | null;
  expiresAt: string;
  createdAt: string;
}

/**
 * Initialize auth database
 */
async function initAuthDB(): Promise<IDBDatabase> {
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
        database.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
  });
}

/**
 * Hash password using Web Crypto API
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Store user credentials offline
 */
export async function storeOfflineUser(
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: "USHER";
  },
  password: string,
): Promise<void> {
  const database = await initAuthDB();
  const passwordHash = await hashPassword(password);

  const offlineUser: OfflineUser = {
    ...user,
    passwordHash,
    lastLogin: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ key: "user", data: offlineUser });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get stored offline user
 */
export async function getOfflineUser(): Promise<OfflineUser | null> {
  const database = await initAuthDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get("user");

    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.data : null);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Validate offline credentials
 */
export async function validateOfflineCredentials(
  identifier: string,
  password: string,
): Promise<OfflineUser | null> {
  const user = await getOfflineUser();
  if (!user) return null;

  // Check if identifier matches email or phone
  const identifierMatch =
    user.email === identifier || user.phone === identifier;
  if (!identifierMatch) return null;

  // Validate password
  const passwordHash = await hashPassword(password);
  if (passwordHash !== user.passwordHash) return null;

  return user;
}

/**
 * Create offline session
 */
export async function createOfflineSession(
  user: OfflineUser,
): Promise<OfflineSession> {
  const database = await initAuthDB();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION);

  const session: OfflineSession = {
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userPhone: user.phone,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ key: "session", data: session });

    request.onsuccess = () => resolve(session);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get current offline session
 */
export async function getOfflineSession(): Promise<OfflineSession | null> {
  const database = await initAuthDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get("session");

    request.onsuccess = () => {
      const result = request.result;
      if (!result) {
        resolve(null);
        return;
      }

      const session: OfflineSession = result.data;
      const now = new Date();
      const expiresAt = new Date(session.expiresAt);

      // Check if session is expired
      if (now > expiresAt) {
        resolve(null);
        return;
      }

      resolve(session);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear offline session (logout)
 */
export async function clearOfflineSession(): Promise<void> {
  const database = await initAuthDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete("session");

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all offline auth data
 */
export async function clearOfflineAuth(): Promise<void> {
  const database = await initAuthDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const clearRequest = store.clear();

    clearRequest.onsuccess = () => resolve();
    clearRequest.onerror = () => reject(clearRequest.error);
  });
}
