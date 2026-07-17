/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Volume2, 
  VolumeX, 
  Dumbbell, 
  Activity, 
  Award,
  Zap,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Check,
  Flame,
  Bot,
  Send,
  RotateCcw,
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { Exercise, ChatMessage } from '../types';
import { getMotivationalPhrase } from '../data/motivational';

// ── Fallback answers when no API key is configured ──────────────────────────

const FALLBACK_ANSWERS: Record<string, string> = {
  forma: 'Para saber si tienes buena forma, concéntrate en dos cosas: control del movimiento (sin rebotes ni impulsos) y que el músculo objetivo sea el que "tira" del peso, no la inercia. Si sientes el músculo principal quemarse, vas bien.',
  musculo: 'El truco es la "conexión mente-músculo": antes de empezar la serie, toca con tu mano el músculo que vas a trabajar y visualiza que se contrae. Durante el movimiento, haz la fase de contracción (subida o empuje) más lenta de lo normal.',
  alternativa: '¡Claro! Puedes sustituir este ejercicio por uno de peso corporal o con mancuernas que trabaje el mismo grupo muscular. Si tienes molestia en alguna articulación, lo mejor es avisarle a tu coach para ajustar la rutina sin riesgo.',
  descanso: 'Para hipertrofia (ganar músculo) lo ideal es descansar entre 60 y 90 segundos entre series. Si el objetivo es fuerza máxima, puedes extender el descanso a 2-3 minutos. Para resistencia muscular, con 30-45 segundos es suficiente.',
  peso: 'Una buena regla es el "test de las últimas 2 reps": si puedes hacer las últimas 2 repeticiones de la serie con buena técnica pero con esfuerzo, el peso es el correcto. Si las últimas reps se sienten muy fáciles, sube el peso.',
  lesion: 'Si tienes dolor agudo durante el ejercicio, para inmediatamente. Un poco de "ardor" muscular es normal, pero el dolor articular no lo es. Consulta con tu coach antes de continuar — siempre es mejor prevenir.',
  default: 'Excelente pregunta. Mi recomendación principal para este ejercicio es enfocarte en la técnica antes que en el peso: controla la velocidad del movimiento, respira correctamente (exhala en el esfuerzo) y escucha a tu cuerpo. ¿Quieres que profundice en algún aspecto específico?',
};

function getFallbackAnswer(question: string, exerciseName: string): string {
  const q = question.toLowerCase();
  if (q.includes('form') || q.includes('bien') || q.includes('correcto') || q.includes('técnica')) return FALLBACK_ANSWERS.forma;
  if (q.includes('músculo') || q.includes('musculo') || q.includes('sentir') || q.includes('activa')) return FALLBACK_ANSWERS.musculo;
  if (q.includes('alternativa') || q.includes('sustituir') || q.includes('reemplazar')) return FALLBACK_ANSWERS.alternativa;
  if (q.includes('descanso') || q.includes('descansar') || q.includes('pausa')) return FALLBACK_ANSWERS.descanso;
  if (q.includes('peso') || q.includes('cuánto') || q.includes('cuanto') || q.includes('kg')) return FALLBACK_ANSWERS.peso;
  if (q.includes('duele') || q.includes('dolor') || q.includes('lesion') || q.includes('lesión')) return FALLBACK_ANSWERS.lesion;
  return FALLBACK_ANSWERS.default;
}

// ── Quick question suggestions ───────────────────────────────────────────────

const QUICK_QUESTIONS = [
  '¿Cómo sé si lo estoy haciendo bien?',
  '¿Qué músculo debo sentir activarse?',
  '¿Cuánto descanso entre series?',
  '¿Cómo elijo el peso correcto?',
  '¿Hay alguna alternativa si me duele?',
];

export interface SetItem {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
}

interface ExerciseDetailProps {
  exercise: Exercise;
  onClose: () => void;
  onComplete: () => void;
  isCompleted: boolean;
  isSeriesMode?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  currentIndex?: number;
  totalExercises?: number;
}

export const ExerciseDetail: React.FC<ExerciseDetailProps> = ({
  exercise,
  onClose,
  onComplete,
  isCompleted,
  isSeriesMode = false,
  onNext,
  onPrev,
  currentIndex = 0,
  totalExercises = 1,
}) => {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'video' | 'anatomy' | 'coach'>('video');
  const [scanPulse, setScanPulse] = useState<boolean>(true);
  const [setsData, setSetsData] = useState<SetItem[]>([]);

  // ── AI Coach state ────────────────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAskingCoach, setIsAskingCoach] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load sets data from localStorage when exercise.id changes
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(`smartfit_sets_${todayStr}_${exercise.id}`);
    if (saved) {
      try {
        setSetsData(JSON.parse(saved));
      } catch (e) {
        setSetsData([
          { setNumber: 1, reps: 10, weight: 10, completed: false },
          { setNumber: 2, reps: 10, weight: 10, completed: false },
          { setNumber: 3, reps: 10, weight: 10, completed: false },
        ]);
      }
    } else {
      setSetsData([
        { setNumber: 1, reps: 10, weight: 10, completed: false },
        { setNumber: 2, reps: 10, weight: 10, completed: false },
        { setNumber: 3, reps: 10, weight: 10, completed: false },
      ]);
    }
  }, [exercise.id]);

  // Auto-save setsData changes to localStorage
  useEffect(() => {
    if (setsData.length === 0) return;
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem(`smartfit_sets_${todayStr}_${exercise.id}`, JSON.stringify(setsData));
  }, [setsData, exercise.id]);

  // Handle single set updates
  const handleUpdateSet = (index: number, field: keyof SetItem, value: any) => {
    setSetsData(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Add series dynamically
  const handleAddSet = () => {
    setSetsData(prev => {
      const nextSetNumber = prev.length + 1;
      const lastSet = prev[prev.length - 1];
      return [
        ...prev,
        {
          setNumber: nextSetNumber,
          reps: lastSet ? lastSet.reps : 10,
          weight: lastSet ? lastSet.weight : 10,
          completed: false
        }
      ];
    });
  };

  // Wrapped complete handler that enforces persistence linking to analytical logs
  const handleCompleteWithPersistence = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Save to direct exercise sets
    localStorage.setItem(`smartfit_sets_${todayStr}_${exercise.id}`, JSON.stringify(setsData));

    // Link to daily analytical history log (smartfit_workout_log_${todayStr})
    const workoutLogKey = `smartfit_workout_log_${todayStr}`;
    const existingLogRaw = localStorage.getItem(workoutLogKey);
    let dayLog: Record<string, { exerciseName: string; sets: SetItem[]; completedAt: string }> = {};
    if (existingLogRaw) {
      try {
        dayLog = JSON.parse(existingLogRaw);
      } catch (e) {
        dayLog = {};
      }
    }
    dayLog[exercise.id] = {
      exerciseName: exercise.name,
      sets: setsData,
      completedAt: new Date().toLocaleTimeString()
    };
    localStorage.setItem(workoutLogKey, JSON.stringify(dayLog));

    // Also update aggregated history log for analysis/profile tracking
    const historyKey = 'smartfit_sets_history';
    const existingHistoryRaw = localStorage.getItem(historyKey);
    let history: Array<{ date: string; exerciseId: string; exerciseName: string; sets: SetItem[] }> = [];
    if (existingHistoryRaw) {
      try {
        history = JSON.parse(existingHistoryRaw);
      } catch (e) {
        history = [];
      }
    }
    // Remove if already exists for today & this exercise
    history = history.filter(item => !(item.date === todayStr && item.exerciseId === exercise.id));
    history.push({
      date: todayStr,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: setsData,
    });
    localStorage.setItem(historyKey, JSON.stringify(history));

    onComplete();
  };

  // Helper to translate and map English categories to Spanish
  const getSpanishBodyPart = (bodyParts: string[]) => {
    const part = bodyParts[0]?.toLowerCase() || '';
    if (part === 'chest') return 'Pecho';
    if (part === 'back') return 'Espalda';
    if (part.includes('leg') || part === 'quads' || part === 'glutes') return 'Pierna';
    return part.charAt(0).toUpperCase() + part.slice(1);
  };

  const capitalize = (str: string) => {
    return str.replace(/\b\w/g, c => c.toUpperCase());
  };

  // Audio instructions text-to-speech reader (Female voice preference)
  const handleToggleSpeech = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        window.speechSynthesis.cancel(); // Stop anything else

        // Clear Step prefixes and speak instructions fluently
        const cleanSteps = exercise.instructions.map(step => step.replace(/^Step:\s*\d+\s*/i, ''));
        const textToSpeak = `Instrucciones para realizar ${exercise.name}. ${cleanSteps.join('. ')}`;
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        
        // Find a female Spanish voice if available
        const voices = window.speechSynthesis.getVoices();
        const femaleKeywords = ['sabina', 'monica', 'paulina', 'helena', 'zira', 'google español', 'lucia', 'maria', 'soledad', 'conchita', 'elena', 'luz', 'marta', 'juana', 'femenino', 'female'];
        
        let esVoice = voices.find(v => {
          const langMatch = v.lang.toLowerCase().startsWith('es') || v.lang.includes('Spanish');
          const nameLower = v.name.toLowerCase();
          return langMatch && femaleKeywords.some(kw => nameLower.includes(kw));
        });
        
        // Fallback to any Spanish voice
        if (!esVoice) {
          esVoice = voices.find(
            v => v.lang.toLowerCase().startsWith('es') || v.lang.includes('Spanish')
          );
        }

        if (esVoice) {
          utterance.voice = esVoice;
        }
        
        utterance.rate = 0.95; // Slightly slower for clear instruction reading
        
        utterance.onend = () => {
          setIsSpeaking(false);
        };
        
        utterance.onerror = () => {
          setIsSpeaking(false);
        };

        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
      }
    } else {
      alert('La síntesis de voz no está soportada en este navegador.');
    }
  };

  // Clean up SpeechSynthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Stop speaking and reset isSpeaking when exercise changes (important for Series Mode)
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    // Also reset chat when exercise changes
    setChatMessages([]);
    setChatInput('');
  }, [exercise.id]);

  // Periodic visual scanner animation for the anatomy diagram
  useEffect(() => {
    const timer = setInterval(() => {
      setScanPulse(prev => !prev);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── AI Coach handler ───────────────────────────────────────────────────────
  const handleAskCoach = useCallback(async (question: string) => {
    if (!question.trim() || isAskingCoach) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: question.trim(),
    };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsAskingCoach(true);

    const coachMsgId = `coach-${Date.now()}`;
    setChatMessages(prev => [...prev, { id: coachMsgId, role: 'coach', text: '', isStreaming: true }]);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'undefined' || apiKey === '') {
      // Fallback: simulate a short delay then show pre-built answer
      await new Promise(r => setTimeout(r, 800));
      const answer = getFallbackAnswer(question, exercise.name);
      setChatMessages(prev =>
        prev.map(m => m.id === coachMsgId ? { ...m, text: answer, isStreaming: false } : m)
      );
      setIsAskingCoach(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      const systemPrompt = `Eres el Coach IA de SmartFit, un asistente de entrenamiento personal integrado en la app del gimnasio. 
Tu rol es responder preguntas sobre ejercicios de forma clara, precisa y motivadora.

Contexto del ejercicio actual:
- Nombre: ${exercise.name}
- Músculo principal: ${exercise.targetMuscles.join(', ')}
- Músculos secundarios: ${exercise.secondaryMuscles.join(', ')}
- Parte del cuerpo: ${exercise.bodyParts.join(', ')}
- Equipamiento: ${exercise.equipment.join(', ')}
- Instrucciones: ${exercise.instructions.map((s, i) => `${i + 1}. ${s.replace(/^Step:\s*\d+\s*/i, '')}`).join(' ')}

Reglas de respuesta:
- Máximo 3 oraciones directas y prácticas
- Tono de coach cercano, en español latinoamericano
- No uses markdown, listas ni emojis en exceso
- Si la pregunta no tiene que ver con el ejercicio, redirige amablemente
- Nunca juzgues al usuario, siempre motiva`;

      const response = await ai.models.generateContentStream({
        model: 'gemini-2.0-flash',
        contents: `${systemPrompt}\n\nPregunta del usuario: ${question}`,
      });

      let fullText = '';
      for await (const chunk of response) {
        const chunkText = chunk.text ?? '';
        fullText += chunkText;
        setChatMessages(prev =>
          prev.map(m => m.id === coachMsgId ? { ...m, text: fullText, isStreaming: true } : m)
        );
      }

      setChatMessages(prev =>
        prev.map(m => m.id === coachMsgId ? { ...m, text: fullText, isStreaming: false } : m)
      );
    } catch {
      const answer = getFallbackAnswer(question, exercise.name);
      setChatMessages(prev =>
        prev.map(m => m.id === coachMsgId ? { ...m, text: answer, isStreaming: false } : m)
      );
    } finally {
      setIsAskingCoach(false);
    }
  }, [exercise, isAskingCoach]);

  // Draw or render custom vector anatomical highlight
  const renderAnatomyDiagram = () => {
    const firstBodyPart = exercise.bodyParts[0]?.toLowerCase() || '';
    const isPecho = firstBodyPart === 'chest';
    const isEspalda = firstBodyPart === 'back';
    const isPierna = firstBodyPart.includes('leg') || firstBodyPart === 'quads' || firstBodyPart === 'glutes';
    const bodyPartEs = getSpanishBodyPart(exercise.bodyParts);

    return (
      <div className="relative w-full aspect-[4/3] bg-brand-dark/80 rounded-xl border border-white/5 flex flex-col items-center justify-center p-4 overflow-hidden">
        
        <div className="flex justify-around items-center w-full max-w-[280px]">
          {/* Torso & Leg schematic diagrams with active muscular highlighting */}
          <svg className="w-36 h-36 text-gray-700 select-none" viewBox="0 0 100 120" fill="none">
            {/* Outline of Human figure */}
            <path d="M50 10 C53 10 55 12 55 15 C55 18 53 20 50 20 C47 20 45 18 45 15 C45 12 47 10 50 10 Z" className="stroke-gray-600" strokeWidth="1.5" />
            <path d="M47 20 L53 20 L58 35 L55 55 L58 85 L56 115 L50 115 L50 85 L44 85 L42 115 L36 115 L34 85 L37 55 L34 35 Z" className="stroke-gray-600" strokeWidth="1.5" />
            
            {/* Pectoral highlight (Pecho) */}
            <g className={`transition-opacity duration-500 ${isPecho ? 'opacity-100' : 'opacity-20'}`}>
              <path d="M41 27 C44 26 47 28 49 31" className="stroke-brand-yellow" strokeWidth="3" strokeLinecap="round" />
              <path d="M59 27 C56 26 53 28 51 31" className="stroke-brand-yellow" strokeWidth="3" strokeLinecap="round" />
              <circle cx="45" cy="30" r="4" className="fill-brand-yellow/30 stroke-brand-yellow" strokeWidth="1" />
              <circle cx="55" cy="30" r="4" className="fill-brand-yellow/30 stroke-brand-yellow" strokeWidth="1" />
            </g>

            {/* Back/Traps highlight (Espalda) */}
            <g className={`transition-opacity duration-500 ${isEspalda ? 'opacity-100' : 'opacity-20'}`}>
              <path d="M40 25 L60 25 L57 45 L43 45 Z" className="fill-brand-yellow/20 stroke-brand-yellow" strokeWidth="1.5" />
              <path d="M45 28 C47 35 53 35 55 28" className="stroke-brand-yellow" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M42 35 C46 41 54 41 58 35" className="stroke-brand-yellow" strokeWidth="2" />
            </g>

            {/* Quads / Glutes highlights (Pierna) */}
            <g className={`transition-opacity duration-500 ${isPierna ? 'opacity-100' : 'opacity-20'}`}>
              <path d="M38 60 L44 60 L47 82 L39 82 Z" className="fill-brand-yellow/30 stroke-brand-yellow" strokeWidth="1.5" />
              <path d="M53 60 L59 60 L57 82 L49 82 Z" className="fill-brand-yellow/30 stroke-brand-yellow" strokeWidth="1.5" />
              <path d="M39 87 L44 87 L43 103 L38 103 Z" className="fill-brand-yellow/10 stroke-brand-yellow/50" strokeWidth="1" />
              <path d="M51 87 L56 87 L54 103 L49 103 Z" className="fill-brand-yellow/10 stroke-brand-yellow/50" strokeWidth="1" />
            </g>
          </svg>

          {/* Muscle Focus Label list */}
          <div className="flex flex-col gap-3 min-w-[120px]">
            <div>
              <h5 className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Músculo Principal</h5>
              {exercise.targetMuscles.map((muscle) => (
                <div key={muscle} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow shadow-[0_0_5px_#FFDE00]" />
                  <span className="text-xs text-white font-medium capitalize">{muscle}</span>
                </div>
              ))}
            </div>

            {exercise.secondaryMuscles.length > 0 && (
              <div>
                <h5 className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold mb-1">Secundarios</h5>
                <div className="flex flex-col gap-1">
                  {exercise.secondaryMuscles.map((muscle) => (
                    <div key={muscle} className="flex items-center gap-1.5 opacity-85">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70" />
                      <span className="text-xs text-zinc-300 font-medium capitalize">{muscle}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-[10px] text-brand-yellow/80 mt-2 text-center bg-brand-yellow/5 border border-brand-yellow/10 px-3 py-1.5 rounded-lg font-bold">
          <Activity className="w-3 h-3 inline-block mr-1" />
          Activación muscular principal en {bodyPartEs}
        </p>
      </div>
    );
  };

  const bodyPartEs = getSpanishBodyPart(exercise.bodyParts);

  const progressPercent = Math.round((currentIndex / totalExercises) * 100);

  return (
    <div className="fixed inset-0 bg-brand-black/90 z-50 overflow-y-auto flex justify-center items-start md:py-6 backdrop-blur-md" id={`exercise-detail-modal-${exercise.id}`}>
      {/* Container simulating high-fidelity smartphone width inside big screen */}
      <div className="w-full max-w-md glass min-h-screen md:min-h-0 md:rounded-3xl shadow-2xl relative flex flex-col pb-8">
        
        {/* Top Header Controls */}
        <div className="sticky top-0 bg-brand-gray/90 backdrop-blur-md z-20 px-4 py-3 border-b border-white/5 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-brand-yellow/10 p-1.5 rounded-lg border border-brand-yellow/20">
                <Dumbbell className="w-4 h-4 text-brand-yellow" />
              </div>
              <div>
                <p className="text-[10px] text-brand-yellow uppercase tracking-widest font-black">
                  {isSeriesMode ? 'Modo Entrenamiento ⚡' : 'Guía de Ejercicio'}
                </p>
                <h2 className="text-xs font-display font-bold text-white tracking-wide">
                  {isSeriesMode ? `Ejercicio ${currentIndex + 1} de ${totalExercises}` : 'Anatomía & Técnica'}
                </h2>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/5 transition-all text-xs text-gray-400 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
              aria-label={isSeriesMode ? "Salir del entrenamiento" : "Cerrar modal de ejercicio"}
            >
              {isSeriesMode ? 'Salir' : <X className="w-4 h-4" />}
            </button>
          </div>

          {/* Progress bar for Series Mode */}
          {isSeriesMode && (
            <div className="w-full flex items-center gap-2 mt-1">
              <div className="flex-1 bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="bg-brand-yellow h-full transition-all duration-500 rounded-full shadow-[0_0_8px_#FFC800]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-zinc-400 font-mono font-bold">{progressPercent}%</span>
            </div>
          )}
        </div>

        {/* Content Box */}
        <div className="p-4 flex-1 flex flex-col gap-5">
          <div>
            <span className="text-[10px] font-semibold text-brand-yellow bg-brand-yellow/10 border border-brand-yellow/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {bodyPartEs}
            </span>
            <h1 className="text-xl font-display font-bold text-white tracking-wide mt-2 capitalize">
              {exercise.name}
            </h1>

            {/* Smart local recommendation coach tip */}
            <div className="mt-3 bg-brand-yellow/5 border border-brand-yellow/15 p-3 rounded-2xl flex gap-2.5 items-start">
              <div className="bg-brand-yellow/10 p-1.5 rounded-lg text-brand-yellow shrink-0">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Enfoque Personalizado IA</p>
                <p className="text-xs text-neutral-200 mt-0.5 leading-relaxed font-medium">
                  {getMotivationalPhrase(exercise.bodyParts, exercise.name)}
                </p>
              </div>
            </div>
          </div>

          {/* Tab switching: GIF / Anatomy / Coach IA */}
          <div className="grid grid-cols-3 gap-1 bg-brand-dark p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('video')}
              className={`py-1.5 text-xs font-display font-semibold rounded-lg transition-all ${
                activeTab === 'video'
                  ? 'bg-brand-gray text-brand-yellow border border-white/5'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              GIF 📹
            </button>
            <button
              onClick={() => setActiveTab('anatomy')}
              className={`py-1.5 text-xs font-display font-semibold rounded-lg transition-all ${
                activeTab === 'anatomy'
                  ? 'bg-brand-gray text-brand-yellow border border-white/5'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Músculos 🧬
            </button>
            <button
              onClick={() => setActiveTab('coach')}
              className={`py-1.5 text-xs font-display font-semibold rounded-lg transition-all ${
                activeTab === 'coach'
                  ? 'bg-brand-gray text-brand-yellow border border-white/5'
                  : 'text-gray-400 hover:text-white'
              }`}
              id="coach-ia-tab-btn"
            >
              Coach 🤖
            </button>
          </div>

          {/* Media Content Stage */}
          {activeTab === 'video' && (
            <div className="relative w-full aspect-[4/3] bg-brand-dark rounded-xl overflow-hidden border border-white/5 flex items-center justify-center group shadow-inner">
              <img
                src={`https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/gifs/${exercise.gif}`}
                alt={exercise.name}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          {activeTab === 'anatomy' && renderAnatomyDiagram()}

          {/* ── COACH IA PANEL ─────────────────────────────────────────── */}
          {activeTab === 'coach' && (
            <div className="flex flex-col gap-3 animate-fade-in" id="coach-ia-panel">

              {/* Header */}
              <div className="flex items-center gap-2.5 bg-brand-yellow/5 border border-brand-yellow/15 rounded-2xl px-3.5 py-3">
                <div className="w-8 h-8 rounded-xl bg-brand-yellow/10 border border-brand-yellow/20 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-brand-yellow" />
                </div>
                <div>
                  <p className="text-[10px] text-brand-yellow font-bold uppercase tracking-wider">Coach IA · SmartFit</p>
                  <p className="text-xs text-gray-300 leading-snug">
                    Pregúntame cualquier duda sobre <span className="text-white font-semibold capitalize">{exercise.name}</span>
                  </p>
                </div>
              </div>

              {/* Quick question chips — only when no conversation yet */}
              {chatMessages.length === 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider px-1">Preguntas frecuentes</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleAskCoach(q)}
                        disabled={isAskingCoach}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium bg-brand-gray border border-white/8 text-gray-300 hover:border-brand-yellow/30 hover:text-brand-yellow transition-all cursor-pointer text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat messages */}
              {chatMessages.length > 0 && (
                <div className="flex flex-col gap-3 max-h-56 overflow-y-auto pr-1" id="coach-chat-messages">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${
                        msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-sm ${
                        msg.role === 'coach'
                          ? 'bg-brand-yellow/10 border border-brand-yellow/20'
                          : 'bg-white/8 border border-white/10'
                      }`}>
                        {msg.role === 'coach' ? <Bot className="w-3.5 h-3.5 text-brand-yellow" /> : '👤'}
                      </div>

                      {/* Bubble */}
                      <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-brand-yellow/10 border border-brand-yellow/15 text-white rounded-tr-sm'
                          : 'bg-brand-gray border border-white/5 text-gray-200 rounded-tl-sm'
                      }`}>
                        {msg.text || (
                          <span className="flex gap-1 items-center text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                        )}
                        {msg.isStreaming && msg.text && (
                          <span className="inline-block w-0.5 h-3 bg-brand-yellow ml-0.5 animate-pulse align-middle" />
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}

              {/* Input row */}
              <div className="flex gap-2 items-center mt-1">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAskCoach(chatInput)}
                  placeholder="Escribe tu pregunta al coach..."
                  disabled={isAskingCoach}
                  className="flex-1 bg-brand-gray border border-white/8 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-brand-yellow/40 focus:ring-1 focus:ring-brand-yellow/20 transition-all disabled:opacity-50"
                  id="coach-chat-input"
                />
                <button
                  onClick={() => handleAskCoach(chatInput)}
                  disabled={!chatInput.trim() || isAskingCoach}
                  className="w-9 h-9 rounded-xl bg-brand-yellow flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-brand-yellow/20 shrink-0"
                  id="coach-send-btn"
                >
                  <Send className="w-4 h-4 text-brand-dark" />
                </button>
              </div>

              {/* Clear conversation */}
              {chatMessages.length > 0 && (
                <button
                  onClick={() => setChatMessages([])}
                  className="flex items-center justify-center gap-1.5 text-[10px] text-gray-600 hover:text-gray-400 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Nueva conversación
                </button>
              )}

            </div>
          )}

          {/* Sets, Reps & Weight Tracking Panel (Modo Entrenamiento / Series Mode) */}
          {isSeriesMode && (
            <div className="bg-brand-dark/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-3.5 animate-fade-in" id="sets-tracking-panel">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h4 className="text-xs font-display font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-brand-yellow animate-pulse" />
                  Registro de Series
                </h4>
                <span className="text-[9px] text-brand-yellow font-black uppercase tracking-wider bg-brand-yellow/10 border border-brand-yellow/20 px-2 py-0.5 rounded-full">
                  Smart Fit Live
                </span>
              </div>

              {/* Responsive Mini Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold border-b border-white/5">
                      <th className="py-2 pl-1">SERIE</th>
                      <th className="py-2 text-center">REPS</th>
                      <th className="py-2 text-center">PESO (KG)</th>
                      <th className="py-2 text-center pr-1">CHECK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {setsData.map((set, index) => (
                      <tr key={index} className="border-b border-white/5 last:border-0 hover:bg-white/[0.01]">
                        {/* Set number */}
                        <td className="py-3.5 pl-1 font-mono font-bold text-zinc-300">
                          {set.setNumber}
                        </td>
                        {/* Reps Input */}
                        <td className="py-2 text-center px-1">
                          <input
                            type="number"
                            inputMode="numeric"
                            value={set.reps || ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              handleUpdateSet(index, 'reps', isNaN(val) ? 0 : val);
                            }}
                            placeholder="0"
                            className="w-16 mx-auto bg-[#2D2D2D] text-white text-center py-1.5 rounded-lg border border-white/5 focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow text-xs font-bold outline-none transition-all"
                          />
                        </td>
                        {/* Weight Input */}
                        <td className="py-2 text-center px-1">
                          <input
                            type="number"
                            inputMode="numeric"
                            value={set.weight || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              handleUpdateSet(index, 'weight', isNaN(val) ? 0 : val);
                            }}
                            placeholder="0"
                            className="w-20 mx-auto bg-[#2D2D2D] text-white text-center py-1.5 rounded-lg border border-white/5 focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow text-xs font-bold outline-none transition-all"
                          />
                        </td>
                        {/* Completed Checkbox */}
                        <td className="py-2 text-center pr-1">
                          <button
                            onClick={() => handleUpdateSet(index, 'completed', !set.completed)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer inline-flex items-center justify-center ${
                              set.completed
                                ? 'bg-brand-yellow border-brand-yellow text-brand-dark shadow-[0_0_10px_#FFC800]'
                                : 'bg-neutral-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                            }`}
                            aria-label={`Completar serie ${set.setNumber}`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add series button */}
              <button
                onClick={handleAddSet}
                className="w-full py-2.5 px-4 bg-[#2D2D2D] hover:bg-neutral-800 border border-white/5 hover:border-brand-yellow/30 text-zinc-300 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                id="add-set-btn"
              >
                <span>+ Agregar Serie</span>
              </button>
            </div>
          )}

          {/* Step-by-Step Instructions & Speech synthesis activator */}
          <div className="bg-brand-dark/40 border border-white/5 rounded-xl p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h4 className="text-xs font-display font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4 text-brand-yellow" />
                Pasos de Ejecución Técnica
              </h4>
              <p className="text-[10px] text-gray-400 leading-normal">
                Sigue las instrucciones guiadas para asegurar un reclutamiento muscular óptimo:
              </p>
            </div>

            <div className="flex flex-col gap-3 mt-1">
              {exercise.instructions.map((step, idx) => (
                <div key={idx} className="flex gap-2.5 items-start">
                  <span className="bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/20 text-[10px] font-black px-1.5 py-0.5 rounded-md mt-0.5 shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                    {step.replace(/^Step:\s*\d+\s*/i, '')}
                  </p>
                </div>
              ))}
            </div>

            {/* TTS Activator Button */}
            <button
              onClick={handleToggleSpeech}
              className={`w-full flex items-center justify-center gap-2 mt-1 py-3.5 px-4 rounded-xl text-xs font-display font-black border transition-all ${
                isSpeaking
                  ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                  : 'yellow-gradient text-brand-dark border-brand-yellow shadow-lg hover:scale-[1.02] active:scale-95 cursor-pointer'
              }`}
              id="tts-instructor-btn"
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4 stroke-[2.5]" />
                  Detener Explicación
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 stroke-[2.5]" />
                  Escuchar Explicación
                </>
              )}
            </button>
          </div>

        </div>

        {/* Action button - completes exercise and updates routine stats */}
        <div className="px-4 pt-2.5 pb-5 border-t border-white/5 bg-brand-gray/95 sticky bottom-0 z-20">
          {isSeriesMode ? (
            <div className="flex gap-3">
              {/* Back button */}
              <button
                disabled={currentIndex === 0}
                onClick={onPrev}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-display font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border ${
                  currentIndex === 0
                    ? 'bg-zinc-900 border-zinc-850 text-zinc-600 cursor-not-allowed'
                    : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700/50 text-zinc-300 hover:text-white cursor-pointer active:scale-95'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Anterior
              </button>

              {/* Complete button */}
              <button
                onClick={isCompleted ? onNext : handleCompleteWithPersistence}
                className="flex-[2] py-3 px-4 rounded-xl text-xs font-display font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-brand-yellow/15 hover:scale-[1.02] active:scale-95 cursor-pointer yellow-gradient text-brand-dark border border-brand-yellow"
                id="series-complete-btn"
              >
                {isCompleted ? (
                  <>
                    <span>Siguiente</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 stroke-[2.5]" />
                    <span>Completar & Sig.</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            isCompleted ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 py-3.5 px-4 rounded-xl text-center text-xs text-emerald-400 font-display font-semibold flex items-center justify-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                ¡Ejercicio Completado Hoy!
              </div>
            ) : (
              <button
                onClick={handleCompleteWithPersistence}
                className="w-full py-4 px-4 rounded-2xl font-display font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[#FFC800]/10 hover:scale-[1.02] active:scale-95 cursor-pointer yellow-gradient text-brand-dark border border-brand-yellow"
                id="complete-exercise-btn"
              >
                <Zap className="w-4 h-4 stroke-[2.5]" />
                Completar ejercicio
              </button>
            )
          )}
        </div>

      </div>
    </div>
  );
};
