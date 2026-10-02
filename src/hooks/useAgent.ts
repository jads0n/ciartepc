'use client';

import { useState, useEffect, useCallback } from 'react';
import { Visitor, OpinionOption } from '@/types';
import {
  getLocalAgent,
  saveLocalAgent,
  getCompletedStations,
  markStationCompleted,
  getOfflineQueue,
  getUnlockedStations,
  unlockStation as saveUnlockStation,
} from '@/lib/storage/offline-sync';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

// Gerador de UUID v4 seguro que funciona em HTTP local e HTTPS
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export function useAgent() {
  const [agent, setAgent] = useState<Visitor | null>(null);
  const [completedStations, setCompletedStations] = useState<string[]>([]);
  const [unlockedStations, setUnlockedStations] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Inicializar ou carregar o Agente
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    let saved = getLocalAgent();
    setCompletedStations(getCompletedStations());
    setUnlockedStations(getUnlockedStations());

    if (saved) {
      // Migra ID antigo que não seja UUID válido para evitar erro 22P02 no Postgres
      if (!isValidUUID(saved.id)) {
        saved.id = generateUUID();
        saveLocalAgent(saved);
      }
      setAgent(saved);
      setPendingSyncCount(getOfflineQueue().length);
      setIsLoading(false);

      // Sempre sincroniza o agente existente com o Supabase usando UPSERT
      if (isSupabaseConfigured()) {
        supabase
          .from('visitors')
          .upsert({
            id: saved.id,
            agent_number: saved.agent_number,
            nickname: saved.nickname,
            total_score: saved.total_score,
            completed_stations_count: saved.completed_stations_count || 0,
            pre_exp_opinion: saved.pre_exp_opinion || null,
            pre_exp_trust: saved.pre_exp_trust || null,
            post_exp_opinion: saved.post_exp_opinion || null,
            post_exp_trust: saved.post_exp_trust || null,
          })
          .then(({ error }) => {
            if (error) console.warn('Supabase visitor initial sync notice:', error.message);
          });
      }
    } else {
      // Criar novo Agente anônimo
      const randomNum = Math.floor(100 + Math.random() * 900);
      const newAgent: Visitor = {
        id: generateUUID(),
        agent_number: randomNum,
        nickname: `AGENTE #${randomNum}`,
        total_score: 0,
        completed_stations_count: 0,
        created_at: new Date().toISOString(),
      };

      saveLocalAgent(newAgent);
      setAgent(newAgent);
      setIsLoading(false);

      // Persistir no Supabase com UPSERT
      if (isSupabaseConfigured()) {
        supabase
          .from('visitors')
          .upsert([
            {
              id: newAgent.id,
              agent_number: newAgent.agent_number,
              nickname: newAgent.nickname,
              total_score: newAgent.total_score,
              completed_stations_count: 0,
            },
          ])
          .then(({ error }) => {
            if (error) console.warn('Supabase new visitor error:', error.message);
          });
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Atualizar Codinome
  const updateNickname = useCallback((newNickname: string) => {
    if (!newNickname.trim()) return;
    setAgent((prev) => {
      if (!prev) return null;
      const updated = { ...prev, nickname: newNickname.trim() };
      saveLocalAgent(updated);

      if (isSupabaseConfigured()) {
        supabase
          .from('visitors')
          .upsert({
            id: updated.id,
            agent_number: updated.agent_number,
            nickname: updated.nickname,
            total_score: updated.total_score,
            completed_stations_count: updated.completed_stations_count || 0,
          })
          .then(({ error }) => {
            if (error) console.warn('Supabase updateNickname error:', error.message);
          });
      }

      return updated;
    });
  }, []);

  // Adicionar Pontuação (XP)
  const addScore = useCallback((points: number) => {
    setAgent((prev) => {
      if (!prev) return null;
      const updated = { ...prev, total_score: prev.total_score + points };
      saveLocalAgent(updated);

      if (isSupabaseConfigured()) {
        supabase
          .from('visitors')
          .upsert({
            id: updated.id,
            agent_number: updated.agent_number,
            nickname: updated.nickname,
            total_score: updated.total_score,
            completed_stations_count: updated.completed_stations_count || 0,
          })
          .then(({ error }) => {
            if (error) console.warn('Supabase addScore error:', error.message);
          });
      }

      return updated;
    });
  }, []);

  // Concluir Estação
  const completeStation = useCallback((stationSlug: string, earnedXp: number = 50) => {
    markStationCompleted(stationSlug);
    setCompletedStations((prev) => {
      if (prev.includes(stationSlug)) return prev;
      return [...prev, stationSlug];
    });

    setAgent((prev) => {
      if (!prev) return null;
      const updated = {
        ...prev,
        total_score: prev.total_score + earnedXp,
        completed_stations_count: prev.completed_stations_count + 1,
      };
      saveLocalAgent(updated);

      if (isSupabaseConfigured()) {
        supabase
          .from('visitors')
          .upsert({
            id: updated.id,
            agent_number: updated.agent_number,
            nickname: updated.nickname,
            total_score: updated.total_score,
            completed_stations_count: updated.completed_stations_count,
          })
          .then(({ error }) => {
            if (error) console.warn('Supabase completeStation error:', error.message);
          });
      }

      return updated;
    });
  }, []);

  // Gravar Pergunta Inicial
  const recordPreOpinion = useCallback((opinion: OpinionOption, trust: number) => {
    setAgent((prev) => {
      if (!prev) return null;
      const updated = { ...prev, pre_exp_opinion: opinion, pre_exp_trust: trust };
      saveLocalAgent(updated);

      if (isSupabaseConfigured()) {
        supabase
          .from('visitors')
          .upsert({
            id: updated.id,
            agent_number: updated.agent_number,
            nickname: updated.nickname,
            total_score: updated.total_score,
            completed_stations_count: updated.completed_stations_count || 0,
            pre_exp_opinion: opinion,
            pre_exp_trust: trust,
          })
          .then(({ error }) => {
            if (error) console.warn('Supabase recordPreOpinion error:', error.message);
          });
      }

      return updated;
    });
  }, []);

  // Gravar Pergunta Posterior
  const recordPostOpinion = useCallback((opinion: OpinionOption, trust: number) => {
    setAgent((prev) => {
      if (!prev) return null;
      const updated = { ...prev, post_exp_opinion: opinion, post_exp_trust: trust };
      saveLocalAgent(updated);

      if (isSupabaseConfigured()) {
        supabase
          .from('visitors')
          .upsert({
            id: updated.id,
            agent_number: updated.agent_number,
            nickname: updated.nickname,
            total_score: updated.total_score,
            completed_stations_count: updated.completed_stations_count || 0,
            post_exp_opinion: opinion,
            post_exp_trust: trust,
          })
          .then(({ error }) => {
            if (error) console.warn('Supabase recordPostOpinion error:', error.message);
          });
      }

      return updated;
    });
  }, []);

  // Desbloquear Estação por QR code ou código de 4 dígitos
  const unlockStation = useCallback((slug: string) => {
    saveUnlockStation(slug);
    setUnlockedStations((prev) => (prev.includes(slug) ? prev : [...prev, slug]));
  }, []);

  return {
    agent,
    isLoading,
    isOnline,
    pendingSyncCount,
    completedStations,
    unlockedStations,
    unlockStation,
    updateNickname,
    addScore,
    completeStation,
    recordPreOpinion,
    recordPostOpinion,
  };
}
