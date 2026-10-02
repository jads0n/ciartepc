import { StationResponse, Visitor } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

const AGENT_STORAGE_KEY = 'turing_lab_agent_session';
const OFFLINE_QUEUE_KEY = 'turing_lab_offline_queue';
const COMPLETED_STATIONS_KEY = 'turing_lab_completed_stations';

export function getLocalAgent(): Visitor | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AGENT_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveLocalAgent(agent: Visitor): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AGENT_STORAGE_KEY, JSON.stringify(agent));
}

export function getCompletedStations(): string[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(COMPLETED_STATIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

const UNLOCKED_STATIONS_KEY = 'turing_lab_unlocked_stations';

export function getUnlockedStations(): string[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(UNLOCKED_STATIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function unlockStation(stationSlug: string): void {
  if (typeof window === 'undefined') return;
  const unlocked = getUnlockedStations();
  if (!unlocked.includes(stationSlug)) {
    unlocked.push(stationSlug);
    localStorage.setItem(UNLOCKED_STATIONS_KEY, JSON.stringify(unlocked));
  }
}

export function isStationUnlocked(stationSlug: string): boolean {
  if (typeof window === 'undefined') return false;
  if (getCompletedStations().includes(stationSlug)) return true;
  return getUnlockedStations().includes(stationSlug);
}

export function markStationCompleted(stationSlug: string): void {
  if (typeof window === 'undefined') return;
  unlockStation(stationSlug);
  const completed = getCompletedStations();
  if (!completed.includes(stationSlug)) {
    completed.push(stationSlug);
    localStorage.setItem(COMPLETED_STATIONS_KEY, JSON.stringify(completed));
  }
}

export function getOfflineQueue(): StationResponse[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function enqueueOfflineResponse(response: StationResponse): void {
  if (typeof window === 'undefined') return;
  const queue = getOfflineQueue();
  queue.push(response);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export async function flushOfflineQueue(): Promise<{ sent: number; remaining: number }> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return { sent: 0, remaining: getOfflineQueue().length };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) return { sent: 0, remaining: 0 };

  if (!isSupabaseConfigured()) {
    // Modo de demonstração local: limpa a fila simulando envio com sucesso
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify([]));
    return { sent: queue.length, remaining: 0 };
  }

  const remaining: StationResponse[] = [];
  let sentCount = 0;

  for (const item of queue) {
    try {
      const { error } = await supabase.from('responses').insert([item]);
      if (error) {
        remaining.push(item);
      } else {
        sentCount++;
      }
    } catch {
      remaining.push(item);
    }
  }

  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
  return { sent: sentCount, remaining: remaining.length };
}

// Inicializar ouvintes de conexão
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushOfflineQueue().catch(console.error);
  });
}
