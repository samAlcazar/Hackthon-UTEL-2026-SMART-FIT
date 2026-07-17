/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React from 'react';
import { Dumbbell, User, Award, Bot, Sparkles, Check, ArrowRight } from 'lucide-react';

export interface DemoUser {
  name: string;
  plan: 'fit' | 'black';
  streak: number;
  totalWorkouts: number;
  lastWorkoutDate: string | null;
}

interface LoginScreenProps {
  onSelectUser: (user: DemoUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSelectUser }) => {
  const handleSelect = (name: string, plan: 'fit' | 'black', streak: number, totalWorkouts: number) => {
    onSelectUser({
      name,
      plan,
      streak,
      totalWorkouts,
      lastWorkoutDate: new Date(Date.now() - 86400000).toISOString().split('T')[0] // ayer
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-brand-dark flex flex-col items-center justify-center p-6 overflow-y-auto">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-sm h-64 bg-brand-yellow/5 rounded-b-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-sm flex flex-col gap-6 relative z-10 my-auto">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="bg-brand-yellow p-3 rounded-2xl shadow-lg shadow-brand-yellow/20">
            <Dumbbell className="w-7 h-7 text-brand-dark stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-display font-black text-xl text-white text-center tracking-tight">
              IMPULSA <span className="text-brand-yellow">FIT</span>
            </h1>
            <p className="text-xs text-gray-400 text-center font-medium">Smart Fit Hackathon Prototipo</p>
          </div>
        </div>

        {/* Info card */}
        <div className="bg-brand-gray border border-white/5 rounded-3xl p-5 text-center flex flex-col gap-2 shadow-2xl">
          <h2 className="font-display font-bold text-sm text-white uppercase tracking-wider flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-brand-yellow animate-pulse" />
            Acceso de Demostración
          </h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Para evaluar la propuesta de negocio freemium del Coach IA, selecciona uno de los perfiles simulados:
          </p>
        </div>

        {/* User Options */}
        <div className="flex flex-col gap-3">
          {/* USER 1: PLAN FIT (BASIC) */}
          <button
            onClick={() => handleSelect('Carlos Mendoza', 'fit', 2, 4)}
            className="w-full bg-brand-gray/60 border border-white/5 hover:border-zinc-700 rounded-3xl p-5 text-left transition-all hover:scale-[1.01] active:scale-95 group cursor-pointer flex flex-col gap-3"
          >
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-display font-black text-white uppercase tracking-wider">Carlos Mendoza</h3>
                  <span className="text-[10px] text-zinc-500 font-bold">Plan Fit (Básico)</span>
                </div>
              </div>
              <span className="text-[9px] font-bold text-zinc-400 bg-zinc-850 px-2 py-0.5 rounded-full border border-white/5 uppercase">
                Estándar
              </span>
            </div>

            <div className="space-y-1 text-[11px] text-gray-400">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                <span>Ejercicios y Ligas estándar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-brand-yellow shrink-0" />
                <span>Límite de 3 consultas al día con el Coach IA</span>
              </div>
            </div>

            <div className="w-full flex items-center justify-end text-[10px] text-brand-yellow font-bold uppercase tracking-wider gap-1 pt-1 opacity-60 group-hover:opacity-100 transition-opacity">
              Probar Plan Fit <ArrowRight className="w-3 h-3" />
            </div>
          </button>

          {/* USER 2: PLAN BLACK (PREMIUM) */}
          <button
            onClick={() => handleSelect('Valeria Rojas', 'black', 5, 12)}
            className="w-full bg-brand-gray/40 border border-brand-yellow/10 hover:border-brand-yellow/30 rounded-3xl p-5 text-left transition-all hover:scale-[1.01] active:scale-95 group cursor-pointer flex flex-col gap-3 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-yellow/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex justify-between items-center w-full relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-yellow/10 border border-brand-yellow/20 flex items-center justify-center text-brand-yellow">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-display font-black text-white uppercase tracking-wider">Valeria Rojas</h3>
                  <span className="text-[10px] text-brand-yellow font-black">Plan Black (Premium)</span>
                </div>
              </div>
              <span className="text-[9px] font-black text-brand-dark bg-brand-yellow px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5 shadow-md shadow-brand-yellow/25">
                <Award className="w-2.5 h-2.5" /> Black
              </span>
            </div>

            <div className="space-y-1 text-[11px] text-gray-400 relative z-10">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-brand-yellow shrink-0" />
                <span>Acceso ILIMITADO al Coach IA</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-brand-yellow shrink-0" />
                <span>Asistente de técnica de ejercicios integrado</span>
              </div>
            </div>

            <div className="w-full flex items-center justify-end text-[10px] text-brand-yellow font-bold uppercase tracking-wider gap-1 pt-1 relative z-10">
              Probar Plan Black <ArrowRight className="w-3 h-3" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
