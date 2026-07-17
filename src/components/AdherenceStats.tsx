/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Flame, Dumbbell, Award, TrendingUp } from 'lucide-react';
import { UserStats } from '../types';

interface AdherenceStatsProps {
  stats: UserStats;
  completedCount: number;
  totalCount: number;
}

export const AdherenceStats: React.FC<AdherenceStatsProps> = ({
  stats,
  completedCount,
  totalCount
}) => {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Determine user badge/tier based on total workouts
  const getBadgeInfo = (workouts: number) => {
    if (workouts === 0) return { title: 'Inicio de Racha', desc: '¡Comienza tu racha hoy!', color: 'text-gray-400' };
    if (workouts < 3) return { title: 'Bronce Constante', desc: 'Adaptando el hábito', color: 'text-amber-500' };
    if (workouts < 8) return { title: 'Atleta de Hierro', desc: '¡Estás en la zona!', color: 'text-yellow-400 font-bold' };
    return { title: 'Leyenda de Acero', desc: 'Adherencia inquebrantable', color: 'text-red-500 font-extrabold animate-pulse' };
  };

  const badge = getBadgeInfo(stats.totalWorkouts);

  // Dynamic feedback quote based on completion
  const getMotivationalQuote = (pct: number) => {
    if (pct === 0) return 'El primer paso es el más importante. ¡Comienza hoy sin prisa y con buena técnica!';
    if (pct < 50) return '¡Gran comienzo! Mantén el control en cada repetición para una contracción muscular perfecta.';
    if (pct < 100) return '¡Falta poco para completar tu rutina con técnica impecable!';
    return '¡Espectacular! Rutina completada al 100% con técnica excelente.';
  };

  return (
    <div className="glass rounded-3xl p-4 sm:p-5 shadow-xl relative border border-brand-yellow/10" id="adherence-stats-panel">
      {/* Absolute decorative glow background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Row: Level Label + Badge Title + Award Pill */}
      <div className="flex justify-between items-center pb-3 border-b border-white/5 relative z-10">
        <div className="min-w-0">
          <span className="text-[10px] text-gray-400 font-display font-bold uppercase tracking-wider block">Nivel de Adherencia</span>
          <h3 className={`text-sm font-display font-black ${badge.color} mt-0.5 truncate`}>{badge.title}</h3>
        </div>
        <div className="flex items-center gap-1.5 bg-brand-yellow/10 border border-brand-yellow/20 px-3 py-1.5 rounded-2xl shrink-0">
          <Award className="w-4 h-4 text-brand-yellow" />
          <span className="text-xs font-display font-black text-brand-yellow">{percentage}%</span>
        </div>
      </div>

      {/* Middle Row: Progress Circle & Stacked Stat Cards */}
      <div className="grid grid-cols-12 gap-3 items-center pt-3 relative z-10">
        {/* Progress Circle & Completion */}
        <div className="col-span-5 flex flex-col items-center justify-center border-r border-white/5 pr-2">
          <div className="relative w-20 h-20 flex items-center justify-center">
            {/* Background Circle */}
            <svg viewBox="0 0 96 96" className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="38"
                className="stroke-brand-gray-light fill-none"
                strokeWidth="7"
              />
              <circle
                cx="48"
                cy="48"
                r="38"
                className="stroke-brand-yellow fill-none transition-all duration-700 ease-out"
                strokeWidth="7"
                strokeDasharray={2 * Math.PI * 38}
                strokeDashoffset={2 * Math.PI * 38 * (1 - percentage / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="text-center z-10">
              <span className="text-lg font-display font-black text-white">{percentage}%</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 font-medium text-center whitespace-nowrap">
            {completedCount} de {totalCount} listos
          </p>
        </div>

        {/* Core Adherence Metrics Stacked */}
        <div className="col-span-7 flex flex-col gap-2 pl-1">
          {/* Streak card */}
          <div className="bg-brand-dark/60 border border-white/5 rounded-xl p-2 flex items-center gap-2.5 min-w-0">
            <div className="bg-brand-yellow/10 p-1.5 rounded-lg shrink-0">
              <Flame className="w-3.5 h-3.5 text-brand-yellow fill-brand-yellow/30" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] text-gray-500 font-display font-bold uppercase tracking-wider leading-tight">Racha actual</p>
              <p className="text-xs font-display font-black text-white leading-tight truncate">
                {stats.streak} {stats.streak === 1 ? 'Día' : 'Días'}
              </p>
            </div>
          </div>

          {/* Total sessions card */}
          <div className="bg-brand-dark/60 border border-white/5 rounded-xl p-2 flex items-center gap-2.5 min-w-0">
            <div className="bg-emerald-500/10 p-1.5 rounded-lg shrink-0">
              <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] text-gray-500 font-display font-bold uppercase tracking-wider leading-tight">Sesiones completadas</p>
              <p className="text-xs font-display font-black text-white leading-tight truncate">
                {stats.totalWorkouts} total
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Motivational message banner */}
      <div className="mt-3 pt-2.5 border-t border-white/5 flex gap-2 items-start relative z-10">
        <TrendingUp className="w-3.5 h-3.5 text-brand-yellow shrink-0 mt-0.5" />
        <p className="text-[11px] text-gray-300 font-medium leading-relaxed italic">
          {getMotivationalQuote(percentage)}
        </p>
      </div>
    </div>
  );
};
