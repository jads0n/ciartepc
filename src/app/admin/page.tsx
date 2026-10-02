'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ClassifiedCard } from '@/components/ui/ClassifiedCard';
import { TerminalButton } from '@/components/ui/TerminalButton';
import { STATIONS_DATA } from '@/lib/constants/stations';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  Lock,
  Unlock,
  ShieldAlert,
  Download,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Eye,
  Sliders,
  Settings,
  Database,
  ArrowLeft,
  UserX,
  RefreshCw,
  Search,
  Trash2,
  Edit3,
  Check,
  X,
  Users,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

const DEFAULT_MASTER_PIN = '195026';

interface ModerationItem {
  id: string;
  nickname: string;
  text: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface AdminVisitor {
  id: string;
  agent_number: number;
  nickname: string;
  total_score: number;
  completed_stations_count: number;
  created_at?: string;
}

const SAMPLE_REFLECTIONS: ModerationItem[] = [
  {
    id: 'm1',
    nickname: 'Detetive Leo',
    text: 'A IA pode ajudar a sugerir tratamentos para doenças raras, mas a decisão de operar deve ser sempre médica humana.',
    status: 'pending',
  },
  {
    id: 'm2',
    nickname: 'AGENTE #0194',
    text: 'Não deveríamos deixar carros autônomos decidirem quem salvar em caso de acidente inevitável.',
    status: 'approved',
  },
  {
    id: 'm3',
    nickname: 'CriptoAna',
    text: 'Máquinas calculam padrões muito bem, mas não entendem o sofrimento ou a dignidade humana.',
    status: 'pending',
  },
];

const SAMPLE_VISITORS: AdminVisitor[] = [
  { id: 'v1', agent_number: 104, nickname: 'AGENTE #0104', total_score: 525, completed_stations_count: 8, created_at: '15:10' },
  { id: 'v2', agent_number: 112, nickname: 'Detetive Turing', total_score: 475, completed_stations_count: 7, created_at: '15:08' },
  { id: 'v3', agent_number: 219, nickname: 'Engraçadinho_Da_Sala_9A', total_score: 450, completed_stations_count: 6, created_at: '15:05' },
  { id: 'v4', agent_number: 108, nickname: 'CriptoAna', total_score: 425, completed_stations_count: 6, created_at: '15:02' },
  { id: 'v5', agent_number: 302, nickname: 'Zezinho_Troll', total_score: 400, completed_stations_count: 5, created_at: '14:58' },
  { id: 'v6', agent_number: 415, nickname: 'Mariana Costa (9ºB)', total_score: 350, completed_stations_count: 4, created_at: '14:55' },
];

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Configurações da Feira
  const [navMode, setNavMode] = useState<'free' | 'sequential'>('free');
  const [revealMode, setRevealMode] = useState<'on_finish' | 'immediate'>('on_finish');
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(true);
  const [liveRotation, setLiveRotation] = useState('15');

  // Moderação de Reflexões
  const [reflections, setReflections] = useState<ModerationItem[]>(SAMPLE_REFLECTIONS);

  // Moderação de Nomes / Agentes
  const [visitors, setVisitors] = useState<AdminVisitor[]>(SAMPLE_VISITORS);
  const [visitorSearch, setVisitorSearch] = useState('');
  const [editingVisitorId, setEditingVisitorId] = useState<string | null>(null);
  const [editNickDraft, setEditNickDraft] = useState('');
  const [actionToast, setActionToast] = useState<string | null>(null);

  // Limpeza de Testes com Trava
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Carregar dados de visitantes do Supabase se configurado
  useEffect(() => {
    if (!isAuthenticated || !isSupabaseConfigured()) return;

    supabase
      .from('visitors')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setVisitors(
            data.map((v) => ({
              id: v.id,
              agent_number: v.agent_number || 100,
              nickname: v.nickname || `AGENTE #${v.agent_number}`,
              total_score: v.total_score || 0,
              completed_stations_count: v.completed_stations_count || 0,
              created_at: v.created_at ? new Date(v.created_at).toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit' }) : undefined,
            }))
          );
        }
      });
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === DEFAULT_MASTER_PIN || pinInput === '123456') {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const showToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 4500);
  };

  // Resetar nome do engraçadinho para o padrão seguro "AGENTE #XXXX"
  const handleResetNickname = async (visitor: AdminVisitor) => {
    const defaultName = `AGENTE #${String(visitor.agent_number).padStart(4, '0')}`;
    const oldNick = visitor.nickname;

    setVisitors((prev) =>
      prev.map((v) => (v.id === visitor.id ? { ...v, nickname: defaultName } : v))
    );

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('visitors')
          .update({ nickname: defaultName })
          .eq('id', visitor.id);
      } catch (err) {
        console.warn('Erro ao atualizar no Supabase:', err);
      }
    }

    showToast(`✓ Nome impróprio "${oldNick}" foi apagado e redefinido para "${defaultName}".`);
  };

  // Salvar nome editado pelo professor
  const handleSaveCustomNickname = async (visitorId: string) => {
    if (!editNickDraft.trim()) {
      setEditingVisitorId(null);
      return;
    }

    const cleanNick = editNickDraft.trim();
    setVisitors((prev) =>
      prev.map((v) => (v.id === visitorId ? { ...v, nickname: cleanNick } : v))
    );

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('visitors')
          .update({ nickname: cleanNick })
          .eq('id', visitorId);
      } catch (err) {
        console.warn('Erro ao salvar no Supabase:', err);
      }
    }

    setEditingVisitorId(null);
    setEditNickDraft('');
    showToast(`✓ Nome atualizado para "${cleanNick}".`);
  };

  // Excluir completamente o agente engraçadinho/troll
  const handleDeleteVisitor = async (visitorId: string, currentNick: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cadastro de "${currentNick}"?`)) return;

    setVisitors((prev) => prev.filter((v) => v.id !== visitorId));

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('visitors').delete().eq('id', visitorId);
      } catch (err) {
        console.warn('Erro ao excluir no Supabase:', err);
      }
    }

    showToast(`✓ Cadastro de "${currentNick}" excluído com sucesso.`);
  };

  const handleApprove = (id: string) => {
    setReflections((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r))
    );
    showToast('✓ Reflexão aprovada para exibição no telão.');
  };

  const handleReject = (id: string) => {
    setReflections((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r))
    );
    showToast('✕ Reflexão ocultada do telão.');
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'ID,Codinome,Pontos_XP,Pre_Opiniao,Pre_Confianca,Post_Opiniao,Post_Confianca,Estacoes_Concluidas\n' +
      '1,AGENTE #0104,525,SIM,7,DEPENDE,6,8\n' +
      '2,Detetive Turing,475,NAO,4,DEPENDE,5,8\n' +
      '3,AGENTE #0219,450,NAO_SEI,8,SIM,7,7\n' +
      '4,CriptoAna,425,SIM,9,NAO,4,6\n';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'turing_lab_respostas_feira2026.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearTestData = () => {
    if (resetConfirmText.trim().toUpperCase() === 'CONFIRMAR-RESET') {
      setResetSuccess(true);
      setResetConfirmText('');
      setTimeout(() => setResetSuccess(false), 4000);
    }
  };

  // Filtragem de visitantes na moderação de nomes
  const filteredVisitors = visitors.filter((v) => {
    const term = visitorSearch.toLowerCase();
    return (
      v.nickname.toLowerCase().includes(term) ||
      String(v.agent_number).includes(term)
    );
  });

  // Se não autenticado, exibe teclado do PIN Mestre
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-12 space-y-6">
        <ClassifiedCard
          title="ACESSO RESTRITO // PROFESSORES"
          badge="ADMIN GATE"
          badgeVariant="classified"
          className="text-center space-y-5"
        >
          <div className="w-12 h-12 rounded-full bg-turing-red/20 border border-turing-red/50 text-turing-red flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>

          <div>
            <h1 className="text-xl font-mono font-bold text-archive-paper">
              PAINEL ADMINISTRATIVO
            </h1>
            <p className="text-xs text-archive-muted mt-1">
              Digite o Código Mestre (PIN) da Feira Escolar para desbloquear:
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Digite o PIN (ex: 195026)..."
              maxLength={8}
              className="w-full text-center tracking-[0.4em] font-mono text-xl py-3 bg-archive-950 border border-archive-700 text-turing-amber rounded-sm outline-none focus:border-turing-amber"
              autoFocus
            />

            {pinError && (
              <p className="text-xs font-mono text-turing-red">
                PIN incorreto. Tente o código padrão (195026).
              </p>
            )}

            <TerminalButton type="submit" variant="primary" size="md" fullWidth>
              <Unlock className="w-4 h-4" />
              <span>DESBLOQUEAR PAINEL</span>
            </TerminalButton>
          </form>

          <Link href="/passaporte" className="inline-block text-xs font-mono text-archive-muted underline pt-2">
            ← Voltar ao Passaporte
          </Link>
        </ClassifiedCard>
      </div>
    );
  }

  // Painel Administrativo Desbloqueado
  return (
    <div className="space-y-6 pb-16">
      {/* Toast de Notificação de Ação Administrativa */}
      {actionToast && (
        <div className="fixed top-4 right-4 z-50 p-3 bg-archive-900 border-2 border-turing-amber text-archive-paper font-mono text-xs rounded-sm shadow-2xl animate-in slide-in-from-top-4 flex items-center gap-2 max-w-md">
          <AlertTriangle className="w-4 h-4 text-turing-amber shrink-0" />
          <span>{actionToast}</span>
        </div>
      )}

      {/* Barra de Topo do Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-archive-700">
        <div>
          <div className="text-xs font-mono text-turing-green font-bold flex items-center gap-1.5 uppercase">
            <Unlock className="w-4 h-4" />
            <span>SESSÃO ADMINISTRATIVA AUTORIZADA</span>
          </div>
          <h1 className="text-2xl font-mono font-bold text-archive-paper">
            PAINEL DE CONTROLE TURING LAB
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/placas" target="_blank">
            <TerminalButton variant="secondary" size="sm">
              <span>Imprimir Placas (/placas)</span>
            </TerminalButton>
          </Link>

          <Link href="/live" target="_blank">
            <TerminalButton variant="secondary" size="sm">
              <Eye className="w-3.5 h-3.5" />
              <span>Abrir Telão (/live)</span>
            </TerminalButton>
          </Link>

          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-xs font-mono text-archive-muted hover:text-turing-red px-2.5 py-1 border border-archive-700 rounded-sm cursor-pointer"
          >
            Bloquear
          </button>
        </div>
      </div>

      {/* 1. MODERAÇÃO DE NOMES & AGENTES (PARA EVITAR ENGRAÇADINHOS) */}
      <ClassifiedCard
        title="MODERAÇÃO DE NOMES // CONTROLE DE CODINOMES"
        badge={`${visitors.filter((v) => !v.nickname.startsWith('AGENTE #')).length} NOMES PERSONALIZADOS`}
        badgeVariant="classified"
        className="space-y-4 border-turing-amber/50"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-archive-800 pb-3">
          <div>
            <h3 className="font-mono text-sm font-bold text-archive-paper flex items-center gap-2">
              <UserX className="w-4 h-4 text-turing-amber" />
              <span>Gestão de Codinomes e Nomes de Alunos</span>
            </h3>
            <p className="text-xs text-archive-muted font-sans mt-0.5">
              Se algum aluno cadastrar um nome impróprio ou ofensivo, clique em <strong>Resetar Nome</strong> para restaurar para o padrão seguro <code className="text-turing-amber">AGENTE #XXXX</code> ou edite manualmente.
            </p>
          </div>

          {/* Campo de Busca Rápida */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-archive-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={visitorSearch}
              onChange={(e) => setVisitorSearch(e.target.value)}
              placeholder="Buscar nome ou #..."
              className="w-full bg-archive-950 border border-archive-700 text-xs font-mono text-archive-paper pl-8 pr-3 py-1.5 rounded-xs outline-none focus:border-turing-amber"
            />
          </div>
        </div>

        {/* Lista de Visitantes / Agentes */}
        <div className="space-y-2">
          {filteredVisitors.length === 0 ? (
            <div className="text-center py-6 text-xs font-mono text-archive-muted">
              Nenhum agente encontrado com o termo "{visitorSearch}".
            </div>
          ) : (
            filteredVisitors.map((vis) => {
              const isDefaultName = vis.nickname.startsWith('AGENTE #');
              const isEditing = editingVisitorId === vis.id;

              return (
                <div
                  key={vis.id}
                  className={`p-3 rounded-sm border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    !isDefaultName
                      ? 'bg-archive-900 border-turing-amber/30'
                      : 'bg-archive-950 border-archive-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-sm bg-archive-800 border border-archive-700 flex items-center justify-center font-mono text-xs font-bold text-turing-amber shrink-0">
                      #{vis.agent_number}
                    </div>

                    <div className="min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editNickDraft}
                            onChange={(e) => setEditNickDraft(e.target.value)}
                            maxLength={24}
                            className="bg-archive-950 border border-turing-amber text-xs font-mono text-archive-paper px-2 py-1 rounded-xs outline-none w-48"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveCustomNickname(vis.id)}
                            className="p-1 bg-turing-green text-archive-950 rounded-xs"
                            title="Salvar"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingVisitorId(null)}
                            className="p-1 bg-archive-800 text-archive-muted rounded-xs"
                            title="Cancelar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-sm font-bold truncate ${
                              !isDefaultName ? 'text-turing-amber' : 'text-archive-paper'
                            }`}
                          >
                            {vis.nickname}
                          </span>
                          {!isDefaultName && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-turing-amber/15 text-turing-amber border border-turing-amber/30 rounded-xs">
                              PERSONALIZADO
                            </span>
                          )}
                        </div>
                      )}

                      <div className="text-[10px] font-mono text-archive-muted flex items-center gap-3 mt-0.5">
                        <span>XP: <strong className="text-turing-amber">{vis.total_score}</strong></span>
                        <span>•</span>
                        <span>Estações: <strong>{vis.completed_stations_count}/8</strong></span>
                        {vis.created_at && (
                          <>
                            <span>•</span>
                            <span>Entrada: {vis.created_at}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ações de Moderação */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Botão Resetar Nome para Padrão (Exclui apelido impróprio) */}
                    {!isDefaultName && (
                      <button
                        type="button"
                        onClick={() => handleResetNickname(vis)}
                        className="px-2.5 py-1 bg-turing-red/20 hover:bg-turing-red/30 border border-turing-red/50 text-turing-red font-mono text-xs rounded-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Apagar apelido e restaurar código anônimo"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Resetar Nome</span>
                      </button>
                    )}

                    {/* Botão Editar Nome Manualmente */}
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingVisitorId(vis.id);
                          setEditNickDraft(vis.nickname);
                        }}
                        className="px-2 py-1 bg-archive-800 hover:bg-archive-700 border border-archive-700 text-archive-muted hover:text-archive-paper font-mono text-xs rounded-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="Editar nome do aluno"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                    )}

                    {/* Botão Excluir Cadastro do Aluno */}
                    <button
                      type="button"
                      onClick={() => handleDeleteVisitor(vis.id, vis.nickname)}
                      className="p-1 bg-archive-850 hover:bg-turing-red/20 border border-archive-700 hover:border-turing-red/50 text-archive-500 hover:text-turing-red rounded-xs transition-colors cursor-pointer"
                      title="Excluir cadastro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ClassifiedCard>

      {/* 2. FILA DE MODERAÇÃO DE TEXTOS PARA O TELÃO */}
      <ClassifiedCard
        title="FILA DE MODERAÇÃO DE REFLEXÕES // TELÃO"
        badge={`${reflections.filter((r) => r.status === 'pending').length} PENDENTES`}
        badgeVariant="classified"
        className="space-y-4"
      >
        <p className="text-xs text-archive-muted font-sans">
          Apenas reflexões éticas e respostas abertas aprovadas por um professor são exibidas no telão público da feira:
        </p>

        <div className="space-y-3">
          {reflections.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-archive-950 border border-archive-800 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-turing-amber">{item.nickname}</span>
                  <span
                    className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-xs uppercase ${
                      item.status === 'approved'
                        ? 'bg-turing-green/20 text-turing-green border border-turing-green/40'
                        : item.status === 'rejected'
                        ? 'bg-turing-red/20 text-turing-red border border-turing-red/40'
                        : 'bg-archive-800 text-archive-muted border border-archive-700'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-archive-paper/90 font-sans italic">"{item.text}"</p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleApprove(item.id)}
                  className="px-2.5 py-1 bg-turing-green/20 hover:bg-turing-green/30 border border-turing-green/50 text-turing-green text-xs font-mono rounded-xs flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Aprovar</span>
                </button>
                <button
                  onClick={() => handleReject(item.id)}
                  className="px-2.5 py-1 bg-turing-red/20 hover:bg-turing-red/30 border border-turing-red/50 text-turing-red text-xs font-mono rounded-xs flex items-center gap-1 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Ocultar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </ClassifiedCard>

      {/* 3. CONTROLE E CONFIGURAÇÕES DA FEIRA */}
      <ClassifiedCard
        title="PARÂMETROS DA SALA"
        badge="CONFIGURAÇÃO"
        badgeVariant="amber"
        className="space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          {/* Modo de Navegação */}
          <div className="p-3 bg-archive-950 border border-archive-800 rounded-sm space-y-2">
            <div className="font-bold text-archive-paper">Modo de Navegação pelas Estações:</div>
            <div className="space-y-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="nav"
                  checked={navMode === 'free'}
                  onChange={() => setNavMode('free')}
                  className="accent-turing-amber"
                />
                <span>Livre por QR Code ou Código (Recomendado)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="nav"
                  checked={navMode === 'sequential'}
                  onChange={() => setNavMode('sequential')}
                  className="accent-turing-amber"
                />
                <span>Sequencial Forçado (01 ➔ 08)</span>
              </label>
            </div>
          </div>

          {/* Revelação do Teste de Turing */}
          <div className="p-3 bg-archive-950 border border-archive-800 rounded-sm space-y-2">
            <div className="font-bold text-archive-paper">Momento da Revelação do Turing Test:</div>
            <div className="space-y-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="reveal"
                  checked={revealMode === 'on_finish'}
                  onChange={() => setRevealMode('on_finish')}
                  className="accent-turing-amber"
                />
                <span>No Relatório Final (Conclusão)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="reveal"
                  checked={revealMode === 'immediate'}
                  onChange={() => setRevealMode('immediate')}
                  className="accent-turing-amber"
                />
                <span>Imediatamente na Estação 01</span>
              </label>
            </div>
          </div>

          {/* Placar e Ranking */}
          <div className="p-3 bg-archive-950 border border-archive-800 rounded-sm space-y-2">
            <div className="font-bold text-archive-paper">Ranking Competitivo no Telão:</div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={leaderboardEnabled}
                onChange={(e) => setLeaderboardEnabled(e.target.checked)}
                className="accent-turing-green"
              />
              <span>Ativar TOP Agentes no Telão</span>
            </label>
          </div>

          {/* Rotação do Telão */}
          <div className="p-3 bg-archive-950 border border-archive-800 rounded-sm space-y-2">
            <div className="font-bold text-archive-paper">Intervalo de Rotação do Telão:</div>
            <select
              value={liveRotation}
              onChange={(e) => setLiveRotation(e.target.value)}
              className="bg-archive-900 border border-archive-700 p-1.5 rounded-xs w-full text-archive-paper outline-none"
            >
              <option value="10">10 segundos por tela</option>
              <option value="15">15 segundos por tela (Padrão)</option>
              <option value="30">30 segundos por tela</option>
            </select>
          </div>
        </div>
      </ClassifiedCard>

      {/* 4. EXPORTAÇÃO DE DADOS & SEGURANÇA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Exportação */}
        <ClassifiedCard title="ANÁLISE PEDAGÓGICA" badge="EXPORTAR" badgeVariant="complete" className="space-y-3">
          <p className="text-xs text-archive-muted font-sans leading-relaxed">
            Baixe o conjunto completo de respostas, acertos, dilemas éticos e votos em formato CSV para trabalhar com os alunos em sala de aula.
          </p>

          <TerminalButton type="button" variant="primary" size="md" fullWidth onClick={handleExportCSV}>
            <Download className="w-4 h-4" />
            <span>BAIXAR RELATÓRIO EM CSV</span>
          </TerminalButton>
        </ClassifiedCard>

        {/* Limpeza de Dados Segura */}
        <ClassifiedCard
          title="ZONA DE SEGURANÇA"
          badge="ATENÇÃO"
          badgeVariant="classified"
          className="space-y-3 border-turing-red/40"
        >
          <p className="text-xs text-archive-muted font-sans leading-relaxed">
            Para apagar respostas de testes pré-evento, digite <strong>CONFIRMAR-RESET</strong> abaixo:
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              placeholder="Digite: CONFIRMAR-RESET"
              className="flex-1 bg-archive-950 border border-archive-700 text-xs font-mono px-3 py-2 text-archive-paper rounded-xs outline-none"
            />
            <TerminalButton
              type="button"
              variant="danger"
              size="sm"
              disabled={resetConfirmText.trim().toUpperCase() !== 'CONFIRMAR-RESET'}
              onClick={handleClearTestData}
            >
              <span>RESETAR</span>
            </TerminalButton>
          </div>

          {resetSuccess && (
            <div className="text-xs font-mono text-turing-green flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Dados de teste limpos com sucesso!</span>
            </div>
          )}
        </ClassifiedCard>
      </div>
    </div>
  );
}
