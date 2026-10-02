'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAgent } from '@/hooks/useAgent';
import { Award, Wifi, WifiOff, Edit3, Check, X, Shield, Lock } from 'lucide-react';

export function TuringTapeHeader() {
  const pathname = usePathname();
  const { agent, isOnline, pendingSyncCount, updateNickname } = useAgent();
  const [isEditingNick, setIsEditingNick] = useState(false);
  const [nickInput, setNickInput] = useState('');

  const handleStartEdit = () => {
    setNickInput(agent?.nickname || '');
    setIsEditingNick(true);
  };

  const handleSaveNick = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickInput.trim()) {
      updateNickname(nickInput.trim());
    }
    setIsEditingNick(false);
  };

  // Não exibir header na tela do quiosque para foco total no terminal
  if (pathname.startsWith('/quiosque')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 bg-archive-900/95 backdrop-blur-md border-b border-archive-700">
      {/* 1. FITA DE TURING PERFURADA (ANIMAÇÃO SUPERIOR) */}
      <div className="h-6 bg-archive-950 border-b border-archive-800 overflow-hidden flex items-center select-none text-[11px] font-mono text-archive-500">
        <div className="flex whitespace-nowrap animate-tape-scroll">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="inline-flex items-center gap-3 px-4">
              <span>0</span>
              <span className="text-turing-amber font-bold">1</span>
              <span>0</span>
              <span>1</span>
              <span className="text-turing-green">A</span>
              <span>B</span>
              <span className="text-archive-600">→</span>
              <span>1</span>
              <span>0</span>
              <span className="text-archive-600">←</span>
              <span>TURING</span>
              <span>LAB</span>
              <span className="text-turing-cyan">1950</span>
              <span className="text-archive-600">|</span>
            </span>
          ))}
        </div>
      </div>

      {/* 2. BARRA DE STATUS DO AGENTE */}
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Identificação do Agente */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-sm bg-turing-amber/15 border border-turing-amber/50 flex items-center justify-center text-turing-amber shrink-0">
            <Shield className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            {isEditingNick ? (
              <form onSubmit={handleSaveNick} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={nickInput}
                  onChange={(e) => setNickInput(e.target.value)}
                  maxLength={18}
                  className="bg-archive-950 border border-turing-amber text-xs font-mono text-archive-paper px-2 py-0.5 rounded-xs outline-none w-32 sm:w-44"
                  autoFocus
                />
                <button
                  type="submit"
                  className="p-1 text-turing-green hover:bg-archive-800 rounded-xs"
                  title="Salvar Codinome"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingNick(false)}
                  className="p-1 text-archive-muted hover:bg-archive-800 rounded-xs"
                  title="Cancelar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs sm:text-sm font-semibold text-archive-paper truncate">
                  {agent?.nickname || 'AGENTE #000'}
                </span>
                <button
                  onClick={handleStartEdit}
                  className="text-archive-500 hover:text-turing-amber p-0.5 rounded-xs transition-colors"
                  title="Editar Codinome"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 text-[10px] font-mono text-archive-muted">
              <span>ESTAÇÕES: {agent?.completed_stations_count || 0}/8</span>
              {pendingSyncCount > 0 && (
                <span className="text-turing-amber flex items-center gap-1">
                  ● Fila: {pendingSyncCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pontuação e Status de Conexão */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1 bg-archive-800 border border-archive-700 px-2.5 py-1 rounded-sm">
            <Award className="w-3.5 h-3.5 text-turing-amber" />
            <span className="font-mono text-xs font-bold text-turing-amber">
              {agent?.total_score || 0} <span className="text-[10px] text-archive-muted font-normal">XP</span>
            </span>
          </div>

          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-sm border text-[10px] font-mono select-none ${
              isOnline
                ? 'bg-turing-green/10 border-turing-green/30 text-turing-green'
                : 'bg-turing-red/10 border-turing-red/30 text-turing-red'
            }`}
            title={isOnline ? 'Conexão ativa' : 'Operando offline. Respostas salvas localmente.'}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3" />
                <span className="hidden sm:inline">ONLINE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                <span>OFFLINE</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. MENU DE NAVEGAÇÃO RÁPIDA */}
      <nav className="max-w-4xl mx-auto px-4 pb-2 flex items-center justify-between gap-1 text-xs font-mono">
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/passaporte"
            className={`px-2.5 py-1 rounded-xs transition-colors ${
              pathname === '/passaporte'
                ? 'bg-turing-amber/20 text-turing-amber font-semibold border-b border-turing-amber'
                : 'text-archive-muted hover:text-archive-paper'
            }`}
          >
            [ PASSAPORTE ]
          </Link>
          <Link
            href="/arquivo-secreto"
            className={`px-2.5 py-1 rounded-xs transition-colors flex items-center gap-1 ${
              pathname === '/arquivo-secreto'
                ? 'bg-turing-amber/20 text-turing-amber font-semibold border-b border-turing-amber'
                : 'text-archive-muted hover:text-archive-paper'
            }`}
          >
            <Lock className="w-2.5 h-2.5" />
            <span className="hidden sm:inline">[ ARQUIVO SECRETO ]</span>
            <span className="sm:hidden">[ SECRETO ]</span>
          </Link>
        </div>

        <Link
          href="/conclusao"
          className={`text-[11px] px-2 py-1 border rounded-xs transition-colors ${
            pathname === '/conclusao'
              ? 'bg-turing-green/20 text-turing-green border-turing-green'
              : 'border-archive-700 text-archive-muted hover:border-archive-500 hover:text-archive-paper'
          }`}
        >
          FINALIZAR
        </Link>
      </nav>
    </header>
  );
}
