/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bot, 
  Send, 
  RotateCcw, 
  Sparkles, 
  Flame, 
  Trophy, 
  CheckCircle2, 
  MessageSquare,
  HelpCircle,
  TrendingUp,
  Brain,
  Award,
  Lock,
  Zap,
  ArrowRight
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { ChatMessage, UserStats, Exercise } from '../types';
import { LEAGUES } from '../data/leagues';

interface AICoachTabProps {
  userStats: UserStats;
  leagueIndex: number;
  weeklyAttendance: number;
  completedExercisesCount: number;
  totalExercisesCount: number;
  exercises: Exercise[];
  userPlan: 'fit' | 'black';
  aiCredits: number;
  onConsumeCredit: () => void;
  onUpgradeToBlack: () => void;
}

// ── General Fallback Coach Answers ───────────────────────────────────────────
const GENERAL_FALLBACK_ANSWERS: Record<string, string> = {
  ejercicio: 'Hoy tienes programados varios ejercicios. Mi recomendación es empezar con los movimientos compuestos de empuje o tracción (como sentadillas o remo) que consumen más energía, y dejar el trabajo analítico de brazos o abdomen para el final. ¡Concéntrate en la contracción lenta!',
  racha: 'Tu racha actual representa consistencia y hábito. Si hoy te sientes cansado, recuerda: no necesitas hacer un entrenamiento de dos horas. Ven al gimnasio y haz una sesión express de 15 minutos o estiramientos. Mantener la racha es una victoria mental.',
  constancia: 'El secreto para no abandonar es la simplicidad. No intentes cambiar tu vida de un día para el otro. Establece una meta de 2 o 3 días a la semana, programa las horas en tu agenda y trata tu entrenamiento como una cita médica no negociable. ¡Tú tienes el control!',
  cansancio: 'El descanso es tan importante como el entrenamiento. Si sientes fatiga extrema, hoy puede ser un buen día de recuperación activa (caminar ligero, estiramientos de movilidad) o un descanso completo. Escuchar a tu cuerpo previene lesiones y te mantiene motivado a largo plazo.',
  liga: 'Las ligas miden tu consistencia semanal. Subes de liga acumulando días activos en la semana. Es un sistema para celebrar tu disciplina constante. ¡Cada sesión te acerca un paso más al ascenso de categoría!',
  default: '¡Excelente pregunta! Como tu Coach IA de SmartFit, mi meta es ayudarte a construir un hábito sólido. Concéntrate en disfrutar el proceso, mantener tu racha activa con pasos cortos pero constantes y celebrar cada pequeña victoria. ¿De qué te gustaría hablar hoy?',
};

function getGeneralFallbackAnswer(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('ejercicio') || q.includes('rutina') || q.includes('entrenar') || q.includes('hacer')) return GENERAL_FALLBACK_ANSWERS.ejercicio;
  if (q.includes('racha') || q.includes('días') || q.includes('streak')) return GENERAL_FALLBACK_ANSWERS.racha;
  if (q.includes('constancia') || q.includes('abandonar') || q.includes('hábito') || q.includes('habito') || q.includes('motivar')) return GENERAL_FALLBACK_ANSWERS.constancia;
  if (q.includes('cansado') || q.includes('cansancio' ) || q.includes('sueño') || q.includes('fatiga') || q.includes('dolor')) return GENERAL_FALLBACK_ANSWERS.cansancio;
  if (q.includes('liga') || q.includes('oro') || q.includes('plata') || q.includes('bronce') || q.includes('ascender')) return GENERAL_FALLBACK_ANSWERS.liga;
  return GENERAL_FALLBACK_ANSWERS.default;
}

// ── General Prompt suggestions ───────────────────────────────────────────────
const GENERAL_QUICK_QUESTIONS = [
  '¿Qué rutina o ejercicios debería priorizar hoy?',
  '¿Cómo mantengo mi racha si me siento cansado?',
  'Consejo práctico para no perder la constancia.',
  '¿Cómo funciona el sistema de Ligas de SmartFit?',
];

export const AICoachTab: React.FC<AICoachTabProps> = ({
  userStats,
  leagueIndex,
  weeklyAttendance,
  completedExercisesCount,
  totalExercisesCount,
  exercises,
  userPlan,
  aiCredits,
  onConsumeCredit,
  onUpgradeToBlack,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const league = LEAGUES[leagueIndex] || LEAGUES[0];

  // ── Load & Restore Conversation ─────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('smartfit_coach_general_chat');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        // Fall back to generating initial message
      }
    }
  }, []);

  // ── Save Conversation ───────────────────────────────────────────────────────
  const saveMessages = (newMessages: ChatMessage[]) => {
    setMessages(newMessages);
    localStorage.setItem('smartfit_coach_general_chat', JSON.stringify(newMessages));
  };

  // ── Auto Scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Generate Welcome Message based on user context ──────────────────────────
  const generateWelcomeMessage = useCallback(() => {
    const todayCompletedMsg = completedExercisesCount > 0 
      ? `¡Felicidades por completar ${completedExercisesCount} de tus ${totalExercisesCount} ejercicios hoy! 💪`
      : `Hoy tienes ${totalExercisesCount} ejercicios en tu rutina para hacer. 🏋️‍♂️`;

    const streakMsg = userStats.streak > 0
      ? `Llevas una racha de ${userStats.streak} días activos. ¡Eso es pura disciplina! 🔥`
      : 'Hoy es un gran día para iniciar una racha y reactivar tu rutina de entrenamiento. 🌟';

    const leagueMsg = `Actualmente estás brillando en la **${league.name}** con ${weeklyAttendance} visitas registradas esta semana. 🏆`;

    const text = `¡Hola, Atleta! Soy tu Coach IA de SmartFit. 🤖\n\nAnalicé tu estado del día:\n- ${streakMsg}\n- ${todayCompletedMsg}\n- ${leagueMsg}\n\n¿En qué te puedo ayudar hoy? Podemos hablar de tu técnica, de cómo vencer el desgano o de cómo estructurar tu entrenamiento. ¡Hagamos que hoy cuente!`;

    const welcomeMsg: ChatMessage = {
      id: 'welcome',
      role: 'coach',
      text,
    };
    saveMessages([welcomeMsg]);
  }, [userStats.streak, completedExercisesCount, totalExercisesCount, leagueIndex, weeklyAttendance]);

  // If chat is empty, generate greeting
  useEffect(() => {
    const saved = localStorage.getItem('smartfit_coach_general_chat');
    if (!saved || JSON.parse(saved).length === 0) {
      generateWelcomeMessage();
    }
  }, [generateWelcomeMessage]);

  // ── Ask Coach Handler ───────────────────────────────────────────────────────
  const handleAskCoach = async (question: string) => {
    if (!question.trim() || isAsking) return;

    // Check plan limits
    if (userPlan === 'fit' && aiCredits <= 0) {
      return; // Handled by UI lock screen
    }

    // Consume credit if on Fit plan
    if (userPlan === 'fit') {
      onConsumeCredit();
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: question.trim(),
    };
    const updatedMessages = [...messages, userMsg];
    saveMessages(updatedMessages);
    setInput('');
    setIsAsking(true);

    const coachMsgId = `coach-${Date.now()}`;
    const newCoachMsg: ChatMessage = { id: coachMsgId, role: 'coach', text: '', isStreaming: true };
    saveMessages([...updatedMessages, newCoachMsg]);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'undefined' || apiKey === '') {
      // Fallback response with slight artificial delay
      await new Promise(r => setTimeout(r, 900));
      const answer = getGeneralFallbackAnswer(question);
      saveMessages([...updatedMessages, { id: coachMsgId, role: 'coach', text: answer, isStreaming: false }]);
      setIsAsking(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      const systemPrompt = `Eres el Coach IA de SmartFit, un entrenador personal virtual empático, experto y motivador. 
Tu objetivo principal es dar consejos accionables para evitar el abandono del gimnasio y fortalecer el hábito.

Contexto actual del usuario:
- Racha de días: ${userStats.streak} días activos
- Ejercicios completados hoy: ${completedExercisesCount} de ${totalExercisesCount}
- Liga de consistencia actual: ${league.name} (${league.description})
- Frecuencia esta semana: ${weeklyAttendance} visitas
- Ejercicios disponibles en su rutina: ${exercises.map(e => e.name).join(', ')}

Instrucciones de respuesta:
- Máximo 3 o 4 oraciones. Debe ser breve, fácil de leer en el teléfono móvil.
- Tono sumamente motivador, positivo y empático. Nunca juzgues ni hables en negativo.
- Responde directamente a la pregunta usando el contexto deportivo del usuario.
- No uses formateo complejo como títulos grandes o listas largas. Solo texto claro, con saltos de línea amigables y negritas útiles.`;

      const response = await ai.models.generateContentStream({
        model: 'gemini-2.0-flash',
        contents: `${systemPrompt}\n\nPregunta del usuario: ${question}`,
      });

      let fullText = '';
      for await (const chunk of response) {
        const chunkText = chunk.text ?? '';
        fullText += chunkText;
        setMessages(prev =>
          prev.map(m => m.id === coachMsgId ? { ...m, text: fullText, isStreaming: true } : m)
        );
      }

      // Finish streaming
      setMessages(prev => {
        const finalMsgs = prev.map(m => m.id === coachMsgId ? { ...m, text: fullText, isStreaming: false } : m);
        localStorage.setItem('smartfit_coach_general_chat', JSON.stringify(finalMsgs));
        return finalMsgs;
      });

    } catch (err) {
      console.error(err);
      const answer = getGeneralFallbackAnswer(question);
      saveMessages([...updatedMessages, { id: coachMsgId, role: 'coach', text: answer, isStreaming: false }]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleResetChat = () => {
    localStorage.removeItem('smartfit_coach_general_chat');
    setMessages([]);
    generateWelcomeMessage();
  };

  // ── UPSELL LOCK SCREEN FOR PLAN FIT WHEN CREDITS ARE 0 ──────────────────────
  if (userPlan === 'fit' && aiCredits <= 0) {
    return (
      <div className="flex flex-col h-full gap-4 items-center justify-center py-6 px-4 animate-fade-in text-center">
        <div className="w-16 h-16 rounded-3xl bg-brand-yellow/10 border border-brand-yellow/30 flex items-center justify-center text-brand-yellow shadow-xl relative">
          <Lock className="w-8 h-8" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-yellow rounded-full text-brand-dark text-[10px] font-black flex items-center justify-center">0</span>
        </div>

        <div>
          <span className="text-[10px] font-black text-brand-yellow bg-brand-yellow/10 border border-brand-yellow/20 px-3 py-1 rounded-full uppercase tracking-wider">
            Límite Alcanzado
          </span>
          <h3 className="font-display font-black text-lg text-white mt-2">
            ¡Has consumido tus 3 consultas gratuitas de hoy!
          </h3>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-xs mx-auto">
            El Plan Fit estándar incluye 3 consultas diarias. Pásate a <strong className="text-white">Plan Black</strong> para obtener acceso ilimitado.
          </p>
        </div>

        {/* Plan Black Feature List */}
        <div className="w-full bg-brand-gray border border-brand-yellow/20 rounded-2xl p-4 flex flex-col gap-2.5 text-left text-xs text-gray-300 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-yellow/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 text-brand-yellow font-display font-bold uppercase tracking-wider text-[11px]">
            <Award className="w-4 h-4" /> Beneficios Smart Fit Black
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Zap className="w-3.5 h-3.5 text-brand-yellow shrink-0" />
            <span>Consultas ilimitadas con el Coach IA 24/7</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Zap className="w-3.5 h-3.5 text-brand-yellow shrink-0" />
            <span>Análisis de técnica e instrucciones por voz</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Zap className="w-3.5 h-3.5 text-brand-yellow shrink-0" />
            <span>Acceso ilimitado a todas las unidades Smart Fit</span>
          </div>
        </div>

        <button
          onClick={onUpgradeToBlack}
          className="w-full py-3.5 px-6 rounded-2xl yellow-gradient text-brand-dark font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-brand-yellow/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
        >
          <span>Mejorar a Plan Black (Demo)</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4 pb-2 animate-fade-in" id="ai-coach-tab-container">
      {/* ── Status Header ── */}
      <div className="bg-brand-gray/60 border border-white/5 rounded-3xl p-4 flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-yellow/10 border border-brand-yellow/20 flex items-center justify-center text-brand-yellow shrink-0">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-black text-sm text-white uppercase tracking-wider">Coach IA Personal</h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-medium">Asesoramiento de Hábitos y Técnica</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Plan badge */}
          {userPlan === 'black' ? (
            <span className="text-[9px] font-black text-brand-dark bg-brand-yellow px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md shadow-brand-yellow/25">
              <Award className="w-3 h-3" /> Black
            </span>
          ) : (
            <span className="text-[9px] font-bold text-brand-yellow bg-brand-yellow/10 border border-brand-yellow/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {aiCredits}/3 Créditos
            </span>
          )}

          <button
            onClick={handleResetChat}
            className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-gray-400 hover:text-white cursor-pointer"
            title="Reiniciar chat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Plan Fit Credit Alert Banner */}
      {userPlan === 'fit' && (
        <div className="bg-brand-yellow/5 border border-brand-yellow/15 rounded-2xl px-3.5 py-2 flex items-center justify-between">
          <span className="text-[10px] text-gray-300">
            Plan Fit: <strong className="text-brand-yellow">{aiCredits} consultas</strong> restantes hoy
          </span>
          <button
            onClick={onUpgradeToBlack}
            className="text-[9px] font-bold text-brand-yellow uppercase tracking-wider hover:underline cursor-pointer"
          >
            Pasar a Black →
          </button>
        </div>
      )}

      {/* ── Chat Messages Stream ── */}
      <div 
        className="flex-1 overflow-y-auto min-h-[250px] max-h-[380px] bg-brand-dark/40 border border-white/5 rounded-3xl p-4 flex flex-col gap-4 shadow-inner"
        id="coach-messages-scroll"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 items-start ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar bubble */}
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border text-sm ${
              msg.role === 'coach' 
                ? 'bg-brand-yellow/10 border-brand-yellow/20 text-brand-yellow' 
                : 'bg-white/5 border-white/10 text-gray-300'
            }`}>
              {msg.role === 'coach' ? <Bot className="w-4 h-4" /> : '👤'}
            </div>

            {/* Message Bubble */}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'bg-brand-yellow/10 border border-brand-yellow/20 text-white rounded-tr-none'
                : 'bg-brand-gray border border-white/5 text-gray-200 rounded-tl-none'
            }`}>
              {msg.text ? (
                <div className="whitespace-pre-line">
                  {/* Clean text highlighting formatting */}
                  {msg.text.split('**').map((chunk, i) => 
                    i % 2 === 1 ? <strong key={i} className="text-brand-yellow font-black">{chunk}</strong> : chunk
                  )}
                </div>
              ) : (
                <div className="flex gap-1 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
              {msg.isStreaming && msg.text && (
                <span className="inline-block w-1 h-3.5 bg-brand-yellow ml-0.5 animate-pulse align-middle" />
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* ── Suggestions Chips ── */}
      {messages.length <= 1 && (
        <div className="flex flex-col gap-2">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider px-1">Sugerencias del Coach</span>
          <div className="flex flex-wrap gap-2">
            {GENERAL_QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleAskCoach(q)}
                disabled={isAsking || (userPlan === 'fit' && aiCredits <= 0)}
                className="px-3.5 py-2 text-left rounded-xl text-xs font-semibold bg-brand-gray border border-white/5 text-gray-300 hover:text-brand-yellow hover:border-brand-yellow/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input bar ── */}
      <div className="flex gap-2 items-center bg-brand-gray/30 border border-white/5 rounded-2xl p-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAskCoach(input)}
          placeholder={userPlan === 'fit' && aiCredits <= 0 ? 'Límite diario alcanzado. Pásate a Black.' : 'Escribe tu consulta o duda de entrenamiento...'}
          disabled={isAsking || (userPlan === 'fit' && aiCredits <= 0)}
          className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder-gray-650 outline-none outline-0 border-0 disabled:opacity-50"
          id="coach-general-input"
        />
        <button
          onClick={() => handleAskCoach(input)}
          disabled={!input.trim() || isAsking || (userPlan === 'fit' && aiCredits <= 0)}
          className="w-10 h-10 rounded-xl bg-brand-yellow flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-brand-yellow/25 shrink-0"
          id="coach-general-send-btn"
        >
          <Send className="w-4 h-4 text-brand-dark" />
        </button>
      </div>

      {/* ── Extra micro-metric banner ── */}
      <div className="flex justify-around items-center bg-brand-dark/40 border border-white/5 py-3 rounded-2xl text-[10px] text-gray-400">
        <div className="flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-brand-yellow" />
          <span>Racha: <strong className="text-white">{userStats.streak} días</strong></span>
        </div>
        <div className="h-4 w-[1px] bg-white/5" />
        <div className="flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-brand-yellow" />
          <span>Liga: <strong className="text-white">{league.name}</strong></span>
        </div>
        <div className="h-4 w-[1px] bg-white/5" />
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-brand-yellow" />
          <span>Hoy: <strong className="text-white">{completedExercisesCount}/{totalExercisesCount}</strong></span>
        </div>
      </div>
    </div>
  );
};
