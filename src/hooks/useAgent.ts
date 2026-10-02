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

    const saved = getLocalAgent();
    setCompletedStations(getCompletedStations());
    setUnlockedStations(getUnlockedStations());

    if (saved) {
      setAgent(saved);
      setPendingSyncCount(getOfflineQueue().length);
      setIsLoading(false);
    } else {
      // Criar novo Agente anônimo
      const randomNum = Math.floor(100 + Math.random() * 900);
      const newAgent: Visitor = {
        id: crypto.randomUUID ? crypto.randomUUID() : `visitor-${Date.now()}`,
        agent_number: randomNum,
        nickname: `AGENTE #${randomNum}`,
        total_score: 0,
        completed_stations_count: 0,
        created_at: new Date().toISOString(),
      };

      saveLocalAgent(newAgent);
      setAgent(newAgent);
      setIsLoading(false);

      // Tenta persistir no Supabase em background
      if (isSupabaseConfigured()) {
        supabase
          .from('visitors')
          .insert([
            {
              id: newAgent.id,
              agent_number: newAgent.agent_number,
              nickname: newAgent.nickname,
              total_score: newAgent.total_score,
            },
          ])
          .then(({ error }) => {
            if (error) console.warn('Supabase offline/sync notice:', error.message);
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
          .update({ nickname: updated.nickname })
          .eq('id', updated.id)
          .then(() => {});
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
          .update({ total_score: updated.total_score })
          .eq('id', updated.id)
          .then(() => {});
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
          .update({
            total_score: updated.total_score,
            completed_stations_count: updated.completed_stations_count,
          })
          .eq('id', updated.id)
          .then(() => {});
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
          .update({ pre_exp_opinion: opinion, pre_exp_trust: trust })
          .eq('id', updated.id)
          .then(() => {});
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
          .update({ post_exp_opinion: opinion, post_exp_trust: trust })
          .eq('id', updated.id)
          .then(() => {});
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
