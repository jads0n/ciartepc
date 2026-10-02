'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAgent } from '@/hooks/useAgent';
import { STATIONS_DATA, findStationByCode } from '@/lib/constants/stations';
import { ClassifiedCard } from '@/components/ui/ClassifiedCard';
import { TerminalButton } from '@/components/ui/TerminalButton';
import {
  ArrowLeft,
  QrCode,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Zap,
  KeyRound,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

export default function ScanPage() {
  const router = useRouter();
  const { unlockStation } = useAgent();

  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ title: string; order: number; slug: string } | null>(null);

  // Fallback de código manual
  const [manualCode, setManualCode] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStoppingRef = useRef(false);

  // Iniciar scanner de QR Code
  useEffect(() => {
    let mounted = true;

    async function startScanner() {
      // Garante que o elemento HTML está pronto no DOM
      const element = document.getElementById('qr-scanner-viewport');
      if (!element || !mounted) return;

      try {
        setScanStatus('scanning');
        setErrorMessage(null);

        const html5QrCode = new Html5Qrcode('qr-scanner-viewport');
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 260, height: 260 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (!mounted || isStoppingRef.current) return;
            handleDecoded(decodedText);
          },
          () => {
            // Frame lido sem QR code (esperado durante a busca contínua)
          }
        );
      } catch (err: unknown) {
        if (!mounted) return;
        console.warn('Erro ao inicializar câmera:', err);
        setScanStatus('error');
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
          setErrorMessage('Permissão de câmera negada. Habilite o acesso à câmera nas configurações do navegador ou digite o código de 4 dígitos abaixo.');
        } else {
          setErrorMessage('Câmera indisponível no momento. Use o app de Câmera padrão do seu celular para ler a placa ou digite o código de 4 dígitos abaixo.');
        }
      }
    }

    startScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        isStoppingRef.current = true;
        if (scannerRef.current.isScanning) {
          scannerRef.current
            .stop()
            .then(() => scannerRef.current?.clear())
            .catch(() => {});
        }
      }
    };
  }, []);

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning && !isStoppingRef.current) {
      isStoppingRef.current = true;
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // Ignora erros ao parar
      }
    }
  };

  const handleDecoded = async (text: string) => {
    await stopScanner();
    setScanStatus('success');

    // Feedback tátil se disponível
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(100);
    }

    // 1. Tenta extrair padrão /estacao/[slug]?code=XXXX
    const urlMatch = text.match(/\/estacao\/([a-zA-Z0-9_-]+)(?:\?code=([a-zA-Z0-9]+))?/i);
    if (urlMatch) {
      const slug = urlMatch[1];
      const code = urlMatch[2];
      const matched = STATIONS_DATA.find((s) => s.slug === slug);
      if (matched) {
        unlockStation(matched.slug);
        setSuccessInfo({ title: matched.title, order: matched.order, slug: matched.slug });
        setTimeout(() => {
          router.push(`/estacao/${matched.slug}${code ? `?code=${code}` : ''}`);
        }, 600);
        return;
      }
    }

    // 2. Tenta código de 4 dígitos (ex: 12AB)
    const codeMatch = findStationByCode(text.trim());
    if (codeMatch) {
      unlockStation(codeMatch.slug);
      setSuccessInfo({ title: codeMatch.title, order: codeMatch.order, slug: codeMatch.slug });
      setTimeout(() => {
        router.push(`/estacao/${codeMatch.slug}`);
      }, 600);
      return;
    }

    // 3. Tenta slug direto (ex: 'turing')
    const slugMatch = STATIONS_DATA.find((s) => s.slug === text.trim().toLowerCase());
    if (slugMatch) {
      unlockStation(slugMatch.slug);
      setSuccessInfo({ title: slugMatch.title, order: slugMatch.order, slug: slugMatch.slug });
      setTimeout(() => {
        router.push(`/estacao/${slugMatch.slug}`);
      }, 600);
      return;
    }

    // 4. URL genérica do mesmo site
    if (text.startsWith('/')) {
      router.push(text);
      return;
    }

    // Não reconhecido
    setScanStatus('error');
    setErrorMessage(`QR Code lido: "${text}". Este QR Code não corresponde a uma estação do laboratório.`);
  };

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = manualCode.trim().toUpperCase();
    if (!clean) return;

    const matched = findStationByCode(clean);
    if (matched) {
      unlockStation(matched.slug);
      setSuccessInfo({ title: matched.title, order: matched.order, slug: matched.slug });
      setTimeout(() => {
        router.push(`/estacao/${matched.slug}`);
      }, 400);
    } else {
      setManualError(`Código "${clean}" não encontrado. Verifique a placa física na mesa.`);
    }
  };

  const handleManualChange = (val: string) => {
    const clean = val.toUpperCase().trim();
    setManualCode(clean);
    setManualError(null);

    if (clean.length === 4) {
      const matched = findStationByCode(clean);
      if (matched) {
        unlockStation(matched.slug);
        setSuccessInfo({ title: matched.title, order: matched.order, slug: matched.slug });
        setTimeout(() => {
          router.push(`/estacao/${matched.slug}`);
        }, 400);
      }
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-5 pb-12">
      {/* Topo */}
      <div className="flex items-center justify-between text-xs font-mono">
        <Link
          href="/passaporte"
          className="text-archive-muted hover:text-archive-paper flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>[ PASSAPORTE ]</span>
        </Link>
        <span className="text-turing-amber font-mono font-semibold">
          LEITOR ÓPTICO
        </span>
      </div>

      <ClassifiedCard
        title="LEITOR DE QR CODE // BANCADA"
        badge={
          scanStatus === 'success'
            ? 'AUTENTICADO'
            : scanStatus === 'error'
            ? 'ALERTA'
            : 'CÂMERA ATIVA'
        }
        badgeVariant={
          scanStatus === 'success'
            ? 'complete'
            : scanStatus === 'error'
            ? 'neutral'
            : 'amber'
        }
        className="space-y-4 text-center"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-mono font-bold text-archive-paper">
            ESCANEAR PLACA DA MESA
          </h1>
          <p className="text-xs font-mono text-archive-muted mt-1">
            Aponte a câmera para o QR Code impresso na bancada do experimento:
          </p>
        </div>

        {/* Viewfinder da Câmera */}
        <div className="relative mx-auto rounded-sm overflow-hidden bg-archive-950 border-2 border-archive-700 max-w-[300px] aspect-square flex items-center justify-center">
          {/* Elemento de renderização da biblioteca html5-qrcode */}
          <div id="qr-scanner-viewport" className="w-full h-full" />

          {/* Mira e Retículo Sci-Fi */}
          {scanStatus === 'scanning' && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-4">
              <div className="w-full flex justify-between">
                <div className="w-5 h-5 border-t-2 border-l-2 border-turing-amber" />
                <div className="w-5 h-5 border-t-2 border-r-2 border-turing-amber" />
              </div>

              {/* Linha laser de scanner animada */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-turing-amber to-transparent animate-pulse shadow-[0_0_8px_#f59e0b]" />

              <div className="w-full flex justify-between">
                <div className="w-5 h-5 border-b-2 border-l-2 border-turing-amber" />
                <div className="w-5 h-5 border-b-2 border-r-2 border-turing-amber" />
              </div>
            </div>
          )}

          {/* Feedback de Sucesso */}
          {scanStatus === 'success' && successInfo && (
            <div className="absolute inset-0 bg-archive-950/95 flex flex-col items-center justify-center p-4 space-y-2 z-10 animate-in fade-in">
              <CheckCircle2 className="w-12 h-12 text-turing-green animate-bounce" />
              <div className="text-xs font-mono text-turing-green font-bold">
                BANCADA RECONHECIDA!
              </div>
              <div className="text-sm font-mono font-bold text-archive-paper">
                Estação {String(successInfo.order).padStart(2, '0')}: {successInfo.title}
              </div>
              <p className="text-[11px] font-mono text-archive-muted">
                Abrindo estação...
              </p>
            </div>
          )}
        </div>

        {/* Mensagem de Erro ou Bloqueio de Câmera */}
        {errorMessage && (
          <div className="p-3 bg-turing-red/15 border border-turing-red/40 text-turing-red text-xs font-mono rounded-xs text-left flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div>{errorMessage}</div>
              <p className="text-[10px] text-archive-muted">
                Dica: você também pode abrir o app nativo de Câmera do seu celular para escanear a placa.
              </p>
            </div>
          </div>
        )}

        {/* Alternativa: Digitar o código de 4 dígitos */}
        <div className="pt-2 border-t border-archive-800 space-y-3">
          <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-archive-muted">
            <KeyRound className="w-3.5 h-3.5 text-turing-amber" />
            <span>OU DIGITE O CÓDIGO DA BANCADA:</span>
          </div>

          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              maxLength={4}
              value={manualCode}
              onChange={(e) => handleManualChange(e.target.value)}
              placeholder="EX: 12AB"
              className="flex-1 bg-archive-950 border border-archive-700 focus:border-turing-amber text-center tracking-widest text-base font-mono font-bold uppercase py-2 px-3 rounded-xs outline-none text-turing-amber"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-turing-amber hover:bg-amber-400 text-archive-950 font-mono text-xs font-bold rounded-xs uppercase tracking-wider cursor-pointer"
            >
              OK
            </button>
          </form>

          {manualError && (
            <p className="text-xs font-mono text-turing-red text-left">
              ✕ {manualError}
            </p>
          )}
        </div>
      </ClassifiedCard>
    </div>
  );
}
