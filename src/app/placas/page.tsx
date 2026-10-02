'use client';

import React from 'react';
import Link from 'next/link';
import { STATIONS_DATA } from '@/lib/constants/stations';
import {
  Printer,
  ArrowLeft,
  QrCode,
  KeyRound,
  Shield,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export default function PlacasPage() {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-archive-950 text-archive-paper py-8 px-4 sm:px-8 space-y-8">
      {/* Barra de Ações (Oculta na Impressão) */}
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-archive-900 border border-archive-700 rounded-sm print:hidden">
        <div>
          <Link
            href="/passaporte"
            className="text-xs font-mono text-archive-muted hover:text-archive-paper flex items-center gap-1 mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Passaporte</span>
          </Link>
          <h1 className="text-xl font-mono font-bold text-turing-amber flex items-center gap-2">
            <QrCode className="w-5 h-5 text-turing-amber" />
            PLACAS DE IDENTIFICAÇÃO DAS 8 BANCADAS
          </h1>
          <p className="text-xs text-archive-muted">
            Imprima estas placas e posicione uma em cada mesa da exposição.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-5 py-2.5 bg-turing-amber text-archive-950 hover:bg-amber-400 font-mono text-xs font-bold rounded-xs flex items-center justify-center gap-2 uppercase tracking-wider shrink-0 transition-transform active:scale-95 cursor-pointer shadow-lg"
        >
          <Printer className="w-4 h-4" />
          <span>IMPRIMIR TODAS AS PLACAS (A4)</span>
        </button>
      </div>

      {/* Grid das Placas */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-1 print:gap-12">
        {STATIONS_DATA.map((station) => {
          // Gerar URL do QR Code para a estação
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&color=0a0d12&bgcolor=ffffff&data=${encodeURIComponent(
            `http://localhost:3000/estacao/${station.slug}`
          )}`;

          return (
            <div
              key={station.slug}
              className="bg-archive-900 border-2 border-archive-700 p-6 sm:p-8 rounded-sm space-y-6 text-center relative overflow-hidden shadow-xl print:border-4 print:border-black print:text-black print:bg-white print:p-10 print:break-after-page print:min-h-[90vh] print:flex print:flex-col print:justify-between"
            >
              {/* Marca D'água Estilo Dossiê */}
              <div className="border-b-2 border-dashed border-archive-700 print:border-black pb-4 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-archive-muted print:text-black">
                  <span>TURING LAB // EXP 2026</span>
                  <span className="font-bold">BLETCHLEY PARK ARCHIVE</span>
                </div>
                <div className="text-xs font-mono text-turing-amber print:text-black uppercase font-bold tracking-widest">
                  ESTAÇÃO {String(station.order).padStart(2, '0')} DE 08
                </div>
                <h2 className="text-2xl sm:text-3xl font-mono font-black text-archive-paper print:text-black">
                  {station.title}
                </h2>
                <div className="text-xs font-mono text-turing-amber print:text-black font-semibold">
                  {station.subtitle}
                </div>
              </div>

              {/* QR Code de Alta Qualidade */}
              <div className="flex flex-col items-center justify-center space-y-2 py-2">
                <div className="p-3 bg-white border-2 border-archive-700 rounded-sm shadow-md inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl}
                    alt={`QR Code Estação ${station.order}`}
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                  />
                </div>
                <p className="text-[11px] font-mono text-archive-muted print:text-gray-700">
                  Aponte a câmera do celular para abrir direto
                </p>
              </div>

              {/* Divisor "OU DIGITE O CÓDIGO" */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-archive-700 print:border-gray-400 w-full" />
                <span className="bg-archive-900 print:bg-white px-3 text-[11px] font-mono text-archive-muted print:text-black font-bold uppercase absolute">
                  OU DIGITE NO SEU PASSAPORTE
                </span>
              </div>

              {/* Código de 4 Dígitos Gigante */}
              <div className="p-4 bg-archive-950 print:bg-gray-100 border-2 border-turing-amber print:border-black rounded-sm space-y-1">
                <div className="text-[10px] font-mono text-archive-muted print:text-gray-700 uppercase tracking-wider">
                  CÓDIGO RÁPIDO DE ACESSO
                </div>
                <div className="text-4xl sm:text-5xl font-mono font-black text-turing-amber print:text-black tracking-[0.25em]">
                  {station.code}
                </div>
              </div>

              {/* Instruções de Rodapé da Placa */}
              <div className="border-t border-dashed border-archive-700 print:border-black pt-3 flex items-center justify-between text-[10px] font-mono text-archive-muted print:text-gray-700">
                <span>Passaporte Digital: turinglab.local</span>
                <span className="text-turing-amber print:text-black font-bold">+{station.xp} XP</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
