'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAgent } from '@/hooks/useAgent';
import { ClassifiedCard } from '@/components/ui/ClassifiedCard';
import { TerminalButton } from '@/components/ui/TerminalButton';
import {
  getCurrentCryptoChallenge,
  CurrentCryptoChallenge,
} from '@/lib/constants/crypto-challenge';
import {
  ArrowLeft,
  Key,
  Lock,
  Unlock,
  CheckCircle2,
  Award,
  Sparkles,
  Clock,
  Flame,
  TrendingUp,
  Radio,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import confetti from 'canvas-confetti';

const SOLVED_SLOTS_STORAGE_KEY = 'turing_lab_solved_crypto_slots';

interface SecretEntry {
  code: string;
  title: string;
  text: string;
  xp: number;
}

const HISTORICAL_SECRETS: Record<string, SecretEntry> = {
  ENIGMA: {
    code: 'ENIGMA',
    title: 'A Máquina Bombe & Bletchley Park',
    text: 'Alan Turing liderou a Hut 8 em Bletchley Park e projetou as "Bombes", máquinas eletromecânicas capazes de testar milhares de combinações diárias do código Enigma militar alemão. Estima-se que seu trabalho encurtou a guerra em mais de 2 anos.',
    xp: 150,
  },
  COLOSSUS: {
    code: 'COLOSSUS',
    title: 'O Primeiro Computador Eletrônico',
    text: 'Enquanto a Bombe era eletromecânica, o Colossus (1943) utilizava mais de 1.500 válvulas eletrônicas para quebrar cifras de teletipo de alto escalão nazista, antecipando os computadores modernos.',
    xp: 150,
  },
  TESTE1950: {
    code: 'TESTE1950',
    title: 'O Jogo da Imitação',
    text: 'Em outubro de 1950, Turing publicou o artigo "Computing Machinery and Intelligence". Ciente de que definir "pensamento" era controverso, ele substituiu a pergunta pelo famoso "Jogo da Imitação".',
    xp: 200,
  },
};

export default function SecretArchivePage() {
  const { agent, addScore } = useAgent();
  const [codeInput, setCodeInput] = useState('');
  const [unlockedCodes, setUnlockedCodes] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Desafio Dinâmico de 30 minutos (+1 letra)
  const [challenge, setChallenge] = useState<CurrentCryptoChallenge>(() =>
    getCurrentCryptoChallenge()
  );
  const [cipherGuess, setCipherGuess] = useState('');
  const [cipherError, setCipherError] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Lista de slots de 30min já resolvidos pelo agente
  const [solvedSlots, setSolvedSlots] = useState<number[]>([]);

  // Carregar slots resolvidos do LocalStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(SOLVED_SLOTS_STORAGE_KEY);
      if (saved) {
        setSolvedSlots(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Timer de 30 minutos atualizado a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      const current = getCurrentCryptoChallenge();
      setChallenge(current);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const isCurrentSlotSolved = solvedSlots.includes(challenge.slotId);

  const handleUnlockCode = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = codeInput.trim().toUpperCase();

    if (!normalized) return;

    if (unlockedCodes.includes(normalized)) {
      setErrorMsg('Este código já foi descriptografado pelo seu agente!');
      return;
    }

    if (HISTORICAL_SECRETS[normalized]) {
      setUnlockedCodes((prev) => [...prev, normalized]);
      addScore(HISTORICAL_SECRETS[normalized].xp);

      if (isSupabaseConfigured() && agent) {
        supabase
          .from('responses')
          .insert([
            {
              visitor_id: agent.id,
              station_id: 'arquivo-secreto-historico',
              question_id: `secret-${normalized}`,
              selected_option: normalized,
              is_correct: true,
              is_kiosk_vote: false,
              created_at: new Date().toISOString(),
            },
          ])
          .then(({ error }) => {
            if (error) console.warn('Supabase secret response log error:', error.message);
          });
      }

      setCodeInput('');
      setErrorMsg('');

      try {
        confetti({ particleCount: 40, spread: 60, colors: ['#f59e0b', '#10b981'] });
      } catch {}
    } else {
      setErrorMsg('CÓDIGO INVÁLIDO. Procure cartazes com códigos secretos na sala!');
    }
  };

  const handleSolveDynamicCipher = (e: React.FormEvent) => {
    e.preventDefault();
    const guess = cipherGuess.trim().toUpperCase();

    if (isCurrentSlotSolved) return;

    // Normaliza acentos se o aluno digitar com ou sem acento
    const normalizedGuess = guess.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const normalizedTarget = challenge.word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (normalizedGuess === normalizedTarget) {
      // Sucesso! Concede o super boost de +250 XP
      addScore(challenge.xpReward);

      // Registra a resposta no Supabase para aparecer no log em tempo real do telão
      if (isSupabaseConfigured() && agent) {
        supabase
          .from('responses')
          .insert([
            {
              visitor_id: agent.id,
              station_id: 'arquivo-secreto',
              question_id: `crypto-slot-${challenge.slotId}`,
              selected_option: normalizedGuess,
              is_correct: true,
              is_kiosk_vote: false,
              created_at: new Date().toISOString(),
            },
          ])
          .then(({ error }) => {
            if (error) console.warn('Supabase crypto response log error:', error.message);
          });
      }

      const updatedSlots = [...solvedSlots, challenge.slotId];
      setSolvedSlots(updatedSlots);
      if (typeof window !== 'undefined') {
        localStorage.setItem(SOLVED_SLOTS_STORAGE_KEY, JSON.stringify(updatedSlots));
      }

      setCipherError(false);
      setCipherGuess('');
      setShowCelebration(true);

      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#06b6d4', '#e11d48'],
        });
      } catch {}
    } else {
      setCipherError(true);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between pb-3 border-b border-archive-700">
        <Link
          href="/passaporte"
          className="text-xs font-mono text-archive-muted hover:text-archive-paper flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>[ PASSAPORTE ]</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1 bg-archive-950 border border-turing-amber/50 rounded-sm font-mono text-xs text-turing-amber flex items-center gap-1.5 shadow-sm">
            <Award className="w-3.5 h-3.5 text-turing-amber" />
            <span className="text-archive-muted text-[10px] uppercase">Seus Pontos:</span>
            <span className="font-bold text-turing-amber">+{agent?.total_score || 0} XP</span>
          </div>
          <span className="text-xs font-mono text-turing-red font-semibold uppercase flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-turing-red animate-pulse" />
            <span className="hidden sm:inline">SALA DE CRIPTOGRAFIA</span>
          </span>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-mono font-bold text-archive-paper flex items-center gap-2">
          <Lock className="w-6 h-6 text-turing-amber" />
          <span>BLETCHLEY PARK // ARQUIVO SECRETO</span>
        </h1>
        <p className="text-xs text-archive-muted mt-1 font-sans">
          Decifre o código rotativo de 30 minutos para ganhar <strong>+250 XP</strong> no ranking ou insira os códigos confidenciais encontrados nos cartazes da feira.
        </p>
      </div>

      {/* 1. DESAFIO DINÂMICO DE 30 MINUTOS (CIFRA DE CÉSAR +1 LETRA // UMA PALAVRA) */}
      <ClassifiedCard
        title="ENIGMA DE BLETCHLEY PARK // CIFRA ROTATIVA DE 30 MIN"
        badge={isCurrentSlotSolved ? 'DECIFRADO' : 'CÓDIGO ATIVO'}
        badgeVariant={isCurrentSlotSolved ? 'complete' : 'amber'}
        className="space-y-4 border-2 border-turing-amber/60 shadow-xl"
      >
        {/* Banner do Timer e Recompensa Máxima */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-archive-950 border border-turing-amber/40 rounded-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xs bg-turing-amber/20 border border-turing-amber/50 flex items-center justify-center text-turing-amber shrink-0">
              <Clock className="w-4 h-4 animate-spin" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-archive-muted uppercase tracking-wider">
                NOVA TRANSMISSÃO EM:
              </div>
              <div className="text-xl font-mono font-black text-turing-amber">
                {challenge.formattedTimeRemaining}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-archive-900 border border-archive-700 px-3 py-1.5 rounded-xs">
            <Flame className="w-4 h-4 text-turing-amber animate-bounce" />
            <div className="text-right">
              <div className="text-[10px] font-mono text-archive-muted uppercase">SUPER RECOMPENSA</div>
              <div className="text-sm font-mono font-black text-turing-green">
                +{challenge.xpReward} XP NO RANKING
              </div>
            </div>
          </div>
        </div>

        {/* Palavra Cifrada da Rodada */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-turing-amber font-semibold uppercase">
              PALAVRA CIFRADA INTERCEPTADA:
            </span>
            <span className="text-archive-muted text-[11px]">
              {challenge.word.length} LETRAS
            </span>
          </div>

          <div className="p-4 bg-archive-950 border-2 border-dashed border-turing-cyan/60 rounded-sm font-mono text-2xl sm:text-3xl tracking-[0.35em] text-turing-cyan font-black mt-1.5 text-center select-all shadow-inner">
            {challenge.encodedWord}
          </div>
        </div>

        {/* Pista Pedagógica Clara: Cifra de César (+1 letra) */}
        <div className="p-3 bg-archive-950/90 border-l-4 border-turing-cyan rounded-r-sm text-xs font-sans text-archive-paper/90 space-y-1.5 leading-relaxed">
          <div className="font-mono font-bold text-turing-cyan flex items-center gap-1.5 text-xs">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>REGRA DE DECIFRAÇÃO (CIFRA DE CÉSAR +1 LETRA):</span>
          </div>
          <p>
            Cada letra da palavra original foi deslocada <strong>exatamente 1 posição para a frente no alfabeto</strong>:
            <br />
            <span className="font-mono text-turing-amber">
              A ➔ B &nbsp;|&nbsp; B ➔ C &nbsp;|&nbsp; C ➔ D ... &nbsp;|&nbsp; Z ➔ A
            </span>
          </p>
          <p className="text-[11px] text-archive-muted">
            💡 <strong>Como decifrar:</strong> Para descobrir a palavra verdadeira, basta <strong>voltar 1 letra</strong> de cada caractere! (ex: se a letra for <strong className="text-turing-paper">U</strong>, a original é <strong className="text-turing-green">T</strong>).
          </p>
        </div>

        {/* Estado Resolvido vs Formulário */}
        {isCurrentSlotSolved ? (
          <div className="p-4 bg-turing-green/15 border-2 border-turing-green/50 rounded-sm space-y-2 text-center animate-in fade-in">
            <div className="flex items-center justify-center gap-2 text-turing-green font-mono text-sm font-bold uppercase">
              <CheckCircle2 className="w-5 h-5" />
              <span>RODADA DECIFRADA COM SUCESSO!</span>
            </div>
            <div className="text-base font-mono font-bold text-archive-paper">
              Palavra Verdadeira: <strong className="text-turing-green">{challenge.word}</strong> (+{challenge.xpReward} XP)
            </div>
            <p className="text-xs font-sans text-archive-paper/90 italic">
              "{challenge.curiosity}"
            </p>
            <div className="text-[11px] font-mono text-archive-muted pt-1 border-t border-turing-green/30">
              Aguarde o timer zerar para decifrar a próxima palavra de 30 minutos e acumular mais pontos!
            </div>
          </div>
        ) : (
          <form onSubmit={handleSolveDynamicCipher} className="space-y-3 pt-1">
            <label className="block text-xs font-mono text-archive-paper font-bold">
              DIGITE A PALAVRA DECIFRADA (VOLTANDO 1 LETRA):
            </label>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={cipherGuess}
                onChange={(e) => {
                  setCipherGuess(e.target.value.toUpperCase());
                  setCipherError(false);
                }}
                maxLength={challenge.word.length + 4}
                placeholder={`Dica: ${challenge.hint.slice(0, 45)}...`}
                className="flex-1 bg-archive-950 border border-archive-700 font-mono text-sm tracking-widest uppercase px-3 py-2.5 text-archive-paper rounded-xs outline-none focus:border-turing-amber"
                autoFocus
              />
              <TerminalButton type="submit" variant="primary" size="md">
                <Zap className="w-4 h-4" />
                <span>DECIFRAR (+250 XP)</span>
              </TerminalButton>
            </div>

            {cipherError && (
              <p className="text-xs font-mono text-turing-red animate-shake">
                ✕ Palavra incorreta. Dica: volte 1 letra de cada caractere no alfabeto (A ➔ Z, B ➔ A...).
              </p>
            )}
          </form>
        )}
      </ClassifiedCard>

      {/* MODAL DE CELEBRAÇÃO QUANDO GANHA O BOOST DE RANKING */}
      {showCelebration && (
        <div className="p-4 bg-gradient-to-r from-turing-amber/20 via-archive-900 to-turing-green/20 border-2 border-turing-amber rounded-sm space-y-3 shadow-2xl animate-in zoom-in-95">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-sm bg-turing-amber text-archive-950 flex items-center justify-center font-mono font-black shrink-0">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xs font-mono text-turing-green font-bold uppercase tracking-wider">
                BOOST DE CRIPTOANALISTA!
              </div>
              <h2 className="text-lg font-mono font-black text-archive-paper">
                +{challenge.xpReward} XP COMPUTADOS NO SEU PERFIL!
              </h2>
            </div>
          </div>
          <p className="text-xs font-sans text-archive-paper/90 leading-relaxed">
            Parabéns, <strong>{agent?.nickname || 'Agente'}</strong>! Você quebrou a Cifra de César da rodada. Sua pontuação saltou para <strong>{agent?.total_score} XP</strong> e seu codinome subiu no ranking do telão!
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowCelebration(false)}
              className="px-4 py-1.5 bg-turing-amber text-archive-950 font-mono text-xs font-bold rounded-xs cursor-pointer"
            >
              CONTINUAR INVESTIGANDO
            </button>
          </div>
        </div>
      )}

      {/* 2. CÓDIGOS SECRETOS FÍSICOS DA SALA */}
      <ClassifiedCard
        title="TERMINAL DE DECODIFICAÇÃO // CÓDIGOS DA SALA"
        badge="HISTÓRICOS"
        badgeVariant="classified"
        className="space-y-4"
      >
        <form onSubmit={handleUnlockCode} className="space-y-3">
          <label className="block text-xs font-mono font-bold text-archive-paper">
            DIGITE OS CÓDIGOS ENCONTRADOS NOS CARTAZES:
          </label>

          <div className="flex gap-2">
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Ex: ENIGMA, COLOSSUS, TESTE1950..."
              className="flex-1 bg-archive-950 border border-archive-700 font-mono text-sm uppercase px-3 py-2 text-archive-paper rounded-xs outline-none focus:border-turing-amber"
            />
            <TerminalButton type="submit" variant="secondary" size="md">
              <Key className="w-4 h-4" />
              <span>DESVENDAR</span>
            </TerminalButton>
          </div>

          {errorMsg && (
            <p className="text-xs font-mono text-turing-red">{errorMsg}</p>
          )}

          <div className="text-[11px] font-mono text-archive-500">
            * Pistas de códigos adicionais estão afixadas nas maquetes e cartazes históricos da sala.
          </div>
        </form>

        {/* Lista de Documentos Desbloqueados */}
        {unlockedCodes.length > 0 && (
          <div className="pt-4 border-t border-archive-800 space-y-3">
            <div className="text-xs font-mono text-turing-green font-bold uppercase flex items-center gap-1.5">
              <Unlock className="w-4 h-4" />
              <span>DOCUMENTOS DESBLOQUEADOS ({unlockedCodes.length})</span>
            </div>

            {unlockedCodes.map((code) => {
              const entry = HISTORICAL_SECRETS[code];
              if (!entry) return null;

              return (
                <div key={code} className="p-3 bg-archive-950 border border-turing-green/40 rounded-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-turing-amber">
                      {entry.title}
                    </span>
                    <span className="font-mono text-[10px] text-turing-green font-bold">
                      +{entry.xp} XP
                    </span>
                  </div>
                  <p className="text-xs text-archive-paper/90 leading-relaxed font-sans pt-1">
                    {entry.text}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </ClassifiedCard>
    </div>
  );
}
