import { clearAnonId } from './storage';

const base = import.meta.env.VITE_API_URL || 'http://localhost:3055';

function getHeaders() {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add JWT token if available
  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add anonymous ID if no token
  if (!token) {
    headers['x-anon-id'] = localStorage.getItem('anonId') || '';
  }

  return headers;
}

export interface TodayChallenge {
  assigned_date: string;
  challenge: {
    id: string;
    slug: string;
    category: string;
    difficulty: number;
    text: string;
  };
  completed_at: string | null;
  skipped_at: string | null;
  note: string | null;
}

export async function getToday(): Promise<TodayChallenge> {
  const res = await fetch(`${base}/api/today`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to fetch today challenge');
  }
  return await res.json();
}

export interface CompleteResponse {
  ok: boolean;
  current_streak: number;
  longest_streak: number;
  comfort_score: number;
}

export async function completeChallenge(note?: string): Promise<CompleteResponse> {
  const res = await fetch(`${base}/api/complete`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ note }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to complete challenge');
  }
  return await res.json();
}

export async function skipChallenge(): Promise<{ ok: boolean; current_streak: number; message: string }> {
  const res = await fetch(`${base}/api/complete/skip`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to skip challenge');
  }
  return await res.json();
}

export interface ProgressData {
  stats: {
    current_streak: number;
    longest_streak: number;
    comfort_score: number;
    badges?: string[];
    new_badges?: string[];
  };
  history: Array<{
    date: string;
    type: 'challenge' | 'journal';
    completed: boolean;
    completed_at: string | null;
    challenge: {
      text: string;
      category: string;
      difficulty: number;
    } | null;
    note: string | null;
    journal_entry?: {
      id: string;
      content: string;
      created_at: string;
      updated_at: string;
    } | null;
  }>;
}

export async function getProgress(): Promise<ProgressData> {
  const res = await fetch(`${base}/api/progress`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to fetch progress');
  }
  return await res.json();
}

export interface Win {
  id: string;
  text: string;
  likes: number;
  created_at: string;
}

export async function getWins(): Promise<Win[]> {
  const res = await fetch(`${base}/api/wins`);
  if (!res.ok) {
    throw new Error('Failed to fetch wins');
  }
  return await res.json();
}

export async function createWin(text: string): Promise<{ id: string }> {
  const res = await fetch(`${base}/api/wins`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create win');
  }
  return await res.json();
}

export async function likeWin(winId: string): Promise<void> {
  const res = await fetch(`${base}/api/wins/${winId}/like`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to like win');
  }
}

// Auth API
export interface AuthResponse {
  user: {
    id: string;
    email: string | null;
  };
  token: string;
}

export interface UserInfo {
  id: string;
  email: string | null;
  hasPassword: boolean;
}

export async function register(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Registration failed');
  }
  const data = await res.json();
  // Store token
  localStorage.setItem('authToken', data.token);
  return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Login failed');
  }
  const data = await res.json();
  // Store token
  localStorage.setItem('authToken', data.token);
  // Update anonId to match logged-in user
  localStorage.setItem('anonId', data.user.id);
  return data;
}

export async function logout(): Promise<void> {
  localStorage.removeItem('authToken');
  // Clear anonId from all storage tiers so a new one can be generated on next load
  // This allows the user to continue as a new anonymous user after logout
  await clearAnonId();
}

export async function getCurrentUser(): Promise<UserInfo> {
  const res = await fetch(`${base}/api/auth/me`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to get user info');
  }
  return await res.json();
}

// Update note for a specific date
export async function updateNote(date: string, note: string | null): Promise<{ ok: boolean; note: string | null }> {
  const res = await fetch(`${base}/api/progress/${date}/note`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ note }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update note');
  }
  return await res.json();
}

// Export user data
export async function exportUserData(): Promise<ProgressData> {
  const res = await fetch(`${base}/api/progress`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to export data');
  }
  return await res.json();
}

// Journal Entry API
export interface JournalEntryData {
  id: string;
  entry_date: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export async function getJournalEntries(): Promise<JournalEntryData[]> {
  const res = await fetch(`${base}/api/journal`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to fetch journal entries');
  }
  return await res.json();
}

export async function createJournalEntry(entry_date: string, content: string): Promise<JournalEntryData> {
  const res = await fetch(`${base}/api/journal`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ entry_date, content }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create journal entry');
  }
  return await res.json();
}

export async function updateJournalEntry(id: string, content: string): Promise<JournalEntryData> {
  const res = await fetch(`${base}/api/journal/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update journal entry');
  }
  return await res.json();
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const res = await fetch(`${base}/api/journal/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete journal entry');
  }
}

