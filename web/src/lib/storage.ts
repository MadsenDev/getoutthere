/**
 * Multi-tier storage for anonymous ID to prevent data loss
 * 
 * Priority order:
 * 1. localStorage (primary, but can be cleared)
 * 2. IndexedDB (more persistent, survives localStorage clears)
 * 3. sessionStorage (temporary, survives page refreshes)
 * 
 * This ensures users don't lose their progress if localStorage is cleared.
 */

const STORAGE_KEY = 'anonId';

/**
 * Get anonymous ID from storage, checking all tiers
 */
export async function getAnonId(): Promise<string | null> {
  // Try localStorage first (most common)
  const localId = localStorage.getItem(STORAGE_KEY);
  if (localId) {
    // Ensure it's also backed up in IndexedDB
    await setAnonIdInIndexedDB(localId);
    return localId;
  }

  // Try IndexedDB (more persistent)
  const indexedId = await getAnonIdFromIndexedDB();
  if (indexedId) {
    // Restore to localStorage
    localStorage.setItem(STORAGE_KEY, indexedId);
    return indexedId;
  }

  // Try sessionStorage (temporary fallback)
  const sessionId = sessionStorage.getItem(STORAGE_KEY);
  if (sessionId) {
    // Restore to localStorage and IndexedDB
    localStorage.setItem(STORAGE_KEY, sessionId);
    await setAnonIdInIndexedDB(sessionId);
    return sessionId;
  }

  return null;
}

/**
 * Set anonymous ID in all storage tiers
 */
export async function setAnonId(id: string): Promise<void> {
  // Set in all tiers
  localStorage.setItem(STORAGE_KEY, id);
  sessionStorage.setItem(STORAGE_KEY, id);
  await setAnonIdInIndexedDB(id);
}

/**
 * IndexedDB operations
 */
const DB_NAME = 'getoutthere';
const DB_VERSION = 1;
const STORE_NAME = 'storage';

async function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

async function getAnonIdFromIndexedDB(): Promise<string | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(STORAGE_KEY);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result || null);
      };
    });
  } catch (error) {
    // IndexedDB not available (e.g., private browsing)
    console.warn('IndexedDB not available:', error);
    return null;
  }
}

async function setAnonIdInIndexedDB(id: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(id, STORAGE_KEY);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    // IndexedDB not available (e.g., private browsing)
    console.warn('IndexedDB not available:', error);
  }
}

/**
 * Export anonymous ID for recovery
 */
export function exportAnonId(): string | null {
  const id = localStorage.getItem(STORAGE_KEY);
  return id;
}

/**
 * Import anonymous ID for recovery
 */
export async function importAnonId(id: string): Promise<void> {
  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new Error('Invalid UUID format');
  }

  await setAnonId(id);
}

