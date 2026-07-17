/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Dumbbell, 
  Sparkles, 
  SlidersHorizontal, 
  ListTodo, 
  Heart, 
  User, 
  Home, 
  Activity, 
  CheckCircle,
  HelpCircle,
  Zap,
  Award,
  Trophy,
  Users,
  Filter,
  Play,
  Bot,
  LogOut
} from 'lucide-react';
import { EXERCISES } from './data/exercises';
import { LEAGUES } from './data/leagues';
import { Exercise, UserStats } from './types';
import { AdherenceStats } from './components/AdherenceStats';
import { AttendanceTracker } from './components/AttendanceTracker';
import { ExerciseCard } from './components/ExerciseCard';
import { ExerciseDetail } from './components/ExerciseDetail';
import { LeagueDashboard } from './components/LeagueDashboard';
import { WorkoutCelebration } from './components/WorkoutCelebration';
import { AICoachTab } from './components/AICoachTab';
import { LoginScreen, DemoUser } from './components/LoginScreen';

export default function App() {
  // --- Demo User & Login Session State ---
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(() => {
    const saved = localStorage.getItem('smartfit_demo_session');
    return saved ? JSON.parse(saved) as DemoUser : null;
  });

  const [aiCredits, setAiCredits] = useState<number>(() => {
    const saved = localStorage.getItem('smartfit_ai_credits');
    return saved ? parseInt(saved, 10) : 3;
  });

  // --- Persistent State Hooks ---
  const [enabledExercises, setEnabledExercises] = useState<string[]>(() => {
    const saved = localStorage.getItem('smartfit_enabled_exercises');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as string[];
        const valid = parsed.filter(id => EXERCISES.some(e => e.id === id));
        if (valid.length > 0) return valid;
      } catch (e) {
        // Fall through
      }
    }
    return EXERCISES.map(e => e.id);
  });

  const [completedExercises, setCompletedExercises] = useState<string[]>(() => {
    const saved = localStorage.getItem('smartfit_completed_exercises');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as string[];
        return parsed.filter(id => EXERCISES.some(e => e.id === id));
      } catch (e) {
        // Fall through
      }
    }
    return [];
  });

  const [isTodayRegistered, setIsTodayRegistered] = useState<boolean>(() => {
    const saved = localStorage.getItem('smartfit_today_registered');
    return saved ? JSON.parse(saved) === 'true' : false;
  });

  const [userStats, setUserStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('smartfit_user_stats');
    // Start with a small, encouraging realistic initial streak to show off the visual indicators!
    return saved ? JSON.parse(saved) : {
      streak: 3,
      totalWorkouts: 8,
      lastWorkoutDate: new Date(Date.now() - 86400000).toISOString().split('T')[0] // Yesterday
    };
  });

  const [leagueIndex, setLeagueIndex] = useState<number>(() => {
    const saved = localStorage.getItem('smartfit_league_index');
    return saved ? parseInt(saved, 10) : 1; // Default to Liga de Plata (1)
  });

  const [weeklyAttendance, setWeeklyAttendance] = useState<number>(() => {
    const saved = localStorage.getItem('smartfit_weekly_attendance');
    return saved ? parseInt(saved, 10) : 2; // Default to 2 sessions
  });

  const [weeksTracked, setWeeksTracked] = useState<number>(() => {
    const saved = localStorage.getItem('smartfit_weeks_tracked');
    return saved ? parseInt(saved, 10) : 2;
  });

  // --- UI Filter & Navigation States ---
  const [activeFilter, setActiveFilter] = useState<'Todos' | 'Pecho' | 'Espalda' | 'Pierna' | 'Hombros' | 'Brazos' | 'Abdomen'>('Todos');
  const [activeEquipment, setActiveEquipment] = useState<'Todos' | 'Mancuernas' | 'Barra' | 'Peso Corporal' | 'Polea/Cable' | 'Bandas'>('Todos');
  const [isCustomizeMode, setIsCustomizeMode] = useState<boolean>(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [activeTab, setActiveTab] = useState<'rutina' | 'coach' | 'ligas' | 'perfil'>('rutina');
  const [currentWorkoutIndex, setCurrentWorkoutIndex] = useState<number | 'celebration' | null>(null);

  // --- Custom Toast Feedback Notifications ---
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'yellow' } | null>(null);

  // Sync state with LocalStorage
  useEffect(() => {
    localStorage.setItem('smartfit_enabled_exercises', JSON.stringify(enabledExercises));
  }, [enabledExercises]);

  useEffect(() => {
    localStorage.setItem('smartfit_completed_exercises', JSON.stringify(completedExercises));
  }, [completedExercises]);

  useEffect(() => {
    localStorage.setItem('smartfit_today_registered', isTodayRegistered ? 'true' : 'false');
  }, [isTodayRegistered]);

  useEffect(() => {
    localStorage.setItem('smartfit_user_stats', JSON.stringify(userStats));
  }, [userStats]);

  useEffect(() => {
    localStorage.setItem('smartfit_league_index', leagueIndex.toString());
  }, [leagueIndex]);

  useEffect(() => {
    localStorage.setItem('smartfit_weekly_attendance', weeklyAttendance.toString());
  }, [weeklyAttendance]);

  useEffect(() => {
    localStorage.setItem('smartfit_weeks_tracked', weeksTracked.toString());
  }, [weeksTracked]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('smartfit_demo_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('smartfit_demo_session');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('smartfit_ai_credits', aiCredits.toString());
  }, [aiCredits]);

  // Show customized floating toast alerts
  const showToast = (message: string, type: 'success' | 'info' | 'yellow' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // --- User Selection & Credit Handlers ---
  const handleSelectUser = (user: DemoUser) => {
    setCurrentUser(user);
    const newStats = {
      streak: user.streak,
      totalWorkouts: user.totalWorkouts,
      lastWorkoutDate: user.lastWorkoutDate
    };
    setUserStats(newStats);
    localStorage.setItem('smartfit_user_stats', JSON.stringify(newStats));

    const newLeagueIndex = user.plan === 'black' ? 3 : 1;
    setLeagueIndex(newLeagueIndex);
    localStorage.setItem('smartfit_league_index', newLeagueIndex.toString());

    const newAttendance = user.plan === 'black' ? 4 : 2;
    setWeeklyAttendance(newAttendance);
    localStorage.setItem('smartfit_weekly_attendance', newAttendance.toString());

    const credits = user.plan === 'fit' ? 3 : 999;
    setAiCredits(credits);
    localStorage.setItem('smartfit_ai_credits', credits.toString());

    localStorage.removeItem('smartfit_coach_general_chat');
    showToast(`Sesión iniciada como ${user.name} (${user.plan === 'black' ? 'Plan Black 👑' : 'Plan Fit ⚡'})`, 'success');
  };

  const handleConsumeCredit = () => {
    setAiCredits(prev => Math.max(0, prev - 1));
  };

  const handleUpgradeToBlack = () => {
    if (!currentUser) return;
    const updatedUser: DemoUser = { ...currentUser, plan: 'black' };
    setCurrentUser(updatedUser);
    setAiCredits(999);
    setLeagueIndex(3);
    showToast('¡Felicidades! Tu cuenta fue actualizada a Plan Black 👑 (Consultas Ilimitadas)', 'yellow');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('smartfit_demo_session');
    showToast('Sesión cerrada. Selecciona un perfil de prueba.', 'info');
  };

  // --- On Mount Check-in and Persuasive Notification ---
  useEffect(() => {
    let currentStreak = userStats.streak;
    let streakReset = false;

    if (userStats.lastWorkoutDate) {
      const today = new Date();
      const lastDate = new Date(userStats.lastWorkoutDate + 'T00:00:00');
      
      // Reset hours to compare calendar days
      today.setHours(0, 0, 0, 0);
      lastDate.setHours(0, 0, 0, 0);

      const diffTime = Math.abs(today.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // If more than 1 day has passed, reset streak
      if (diffDays > 1 && today.toISOString().split('T')[0] !== userStats.lastWorkoutDate) {
        currentStreak = 0;
        streakReset = true;
        setUserStats(prev => ({
          ...prev,
          streak: 0
        }));
      }
    }

    // Trigger persuasive load message after a slight delay
    const timer = setTimeout(() => {
      const todayRegistered = localStorage.getItem('smartfit_today_registered') === 'true';
      if (!todayRegistered) {
        if (streakReset) {
          showToast('Tu racha de días consecutivos se ha reiniciado. ¡Es un buen día para comenzar de nuevo! ⚡', 'info');
        } else if (currentStreak > 0) {
          showToast(`¡Mantén tu racha de ${currentStreak} días activa! No te saltes el entrenamiento de hoy. 🔥`, 'yellow');
        } else {
          showToast('¡Empieza una racha hoy! No te saltes el entrenamiento de hoy y sube de liga. 🚀', 'info');
        }
      } else {
        showToast('¡Felicidades por completar tu entrenamiento de hoy! ¡Sigue manteniendo esa consistencia! 🏆', 'success');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  // --- Interactive Callback Handlers ---
  
  // Register gym attendance (increments streak and total sessions)
  const handleRegisterToday = () => {
    if (isTodayRegistered) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const newStats = { ...userStats };
    
    newStats.totalWorkouts += 1;
    newStats.streak += 1;
    newStats.lastWorkoutDate = todayStr;

    setUserStats(newStats);
    setIsTodayRegistered(true);
    setWeeklyAttendance(prev => Math.min(prev + 1, 7));

    const nextLeagueName = leagueIndex < LEAGUES.length - 1 ? LEAGUES[leagueIndex + 1].name : 'Liga Diamante';
    showToast(`¡Felicidades! Estás más cerca de ascender a la ${nextLeagueName}. 🚀`, 'success');
  };

  // Toggle exercise active/inactive within customization checkboxes
  const handleToggleEnableExercise = (id: string) => {
    let nextEnabled = [...enabledExercises];
    if (nextEnabled.includes(id)) {
      // Must have at least 1 exercise active
      if (nextEnabled.length === 1) {
        showToast('Debes mantener al menos un ejercicio en tu rutina para hoy.', 'info');
        return;
      }
      nextEnabled = nextEnabled.filter(item => item !== id);
      // If removed, make sure it is also removed from today's completed list
      setCompletedExercises(prev => prev.filter(item => item !== id));
      showToast('Ejercicio removido de tu rutina del día.', 'info');
    } else {
      nextEnabled.push(id);
      showToast('Ejercicio añadido a tu rutina del día! 💪', 'success');
    }
    setEnabledExercises(nextEnabled);
  };

  // Complete exercise safety walkthrough
  const handleCompleteExercise = (id: string) => {
    if (completedExercises.includes(id)) return;

    const nextCompleted = [...completedExercises, id];
    setCompletedExercises(nextCompleted);
    
    // Auto trigger attendance register on completing their first exercise of the day
    if (!isTodayRegistered) {
      handleRegisterToday();
    } else {
      const nextLeagueName = leagueIndex < LEAGUES.length - 1 ? LEAGUES[leagueIndex + 1].name : 'Liga Diamante';
      showToast(`¡Felicidades! Estás más cerca de ascender a la ${nextLeagueName}. 🚀`, 'success');
    }

    setSelectedExercise(null); // Close modal
  };

  // --- Workout Series Navigation Callback Handlers ---
  const handleNextWorkout = () => {
    if (currentWorkoutIndex === null || currentWorkoutIndex === 'celebration') return;
    
    const nextIndex = currentWorkoutIndex + 1;
    if (nextIndex >= filteredExercises.length) {
      // Completed the whole series!
      if (!isTodayRegistered) {
        handleRegisterToday();
      }
      setCurrentWorkoutIndex('celebration');
    } else {
      setCurrentWorkoutIndex(nextIndex);
    }
  };

  const handlePrevWorkout = () => {
    if (currentWorkoutIndex === null || currentWorkoutIndex === 'celebration' || currentWorkoutIndex === 0) return;
    setCurrentWorkoutIndex(currentWorkoutIndex - 1);
  };

  const handleCompleteSeriesExercise = (id: string) => {
    if (!completedExercises.includes(id)) {
      setCompletedExercises(prev => [...prev, id]);
    }
    
    if (!isTodayRegistered) {
      handleRegisterToday();
    }

    const nextIndex = (currentWorkoutIndex as number) + 1;
    if (nextIndex >= filteredExercises.length) {
      setCurrentWorkoutIndex('celebration');
    } else {
      setCurrentWorkoutIndex(nextIndex);
    }
  };

  // Reset progress for demo/restart purposes
  const handleResetProgress = () => {
    setCompletedExercises([]);
    setIsTodayRegistered(false);
    setUserStats({
      streak: 0,
      totalWorkouts: 0,
      lastWorkoutDate: null
    });
    setLeagueIndex(1);
    setWeeklyAttendance(2);
    setWeeksTracked(2);
    showToast('Progreso y Ligas reiniciados. ¡Comienza una nueva racha limpia! 🌟', 'info');
  };

  // --- League Simulation Callbacks ---
  const handleAddWeeklyAttendance = () => {
    if (weeklyAttendance >= 7) return;
    setWeeklyAttendance(prev => prev + 1);
    showToast('¡Sesión semanal simulada con éxito! (+1 asistencia) 🏋️‍♂️', 'success');
  };

  const handleEndWeekSimulation = () => {
    const minRequired = 3;
    const promoted = weeklyAttendance >= minRequired;
    let nextIndex = leagueIndex;
    let msg = '';
    let toastType: 'success' | 'info' | 'yellow' = 'success';

    if (promoted) {
      if (leagueIndex === LEAGUES.length - 1) {
        msg = `¡Semana completada con ${weeklyAttendance} asistencias! Te mantienes en la máxima categoría: ${LEAGUES[leagueIndex].name} 👑🏆`;
        toastType = 'yellow';
      } else {
        nextIndex = leagueIndex + 1;
        msg = `¡Felicidades! Lograste ${weeklyAttendance} asistencias esta semana y ascendiste a la ${LEAGUES[nextIndex].name}! 🚀🏆`;
        toastType = 'success';
      }
    } else {
      if (leagueIndex === 0) {
        msg = `Semana terminada con ${weeklyAttendance} asistencias. Mantienes tu posición en la ${LEAGUES[leagueIndex].name}. ¡Necesitas al menos 3 días para ascender! 💪`;
        toastType = 'info';
      } else {
        nextIndex = leagueIndex - 1;
        msg = `Semana terminada con ${weeklyAttendance} asistencias. Descendiste a la ${LEAGUES[nextIndex].name}. ¡Esfuérzate por conseguir 3 asistencias la próxima semana! ⚡`;
        toastType = 'info';
      }
    }

    setLeagueIndex(nextIndex);
    setWeeklyAttendance(0);
    setWeeksTracked(prev => prev + 1);
    setIsTodayRegistered(false);
    setCompletedExercises([]);
    showToast(msg, toastType);
  };

  const handleResetLeaguesSimulation = () => {
    setLeagueIndex(1);
    setWeeklyAttendance(2);
    setWeeksTracked(2);
    showToast('Ligas reiniciadas a la configuración inicial de demostración. 🎖️', 'info');
  };

  // Filter exercises by category and equipment
  const filteredExercises = EXERCISES.filter((ex) => {
    // 1. Muscle Filter
    let matchesMuscle = activeFilter === 'Todos';
    if (!matchesMuscle) {
      const part = ex.bodyParts[0]?.toLowerCase() || '';
      if (activeFilter === 'Pecho' && part === 'chest') matchesMuscle = true;
      if (activeFilter === 'Espalda' && part === 'back') matchesMuscle = true;
      if (activeFilter === 'Pierna' && (part.includes('leg') || part === 'quads' || part === 'glutes')) matchesMuscle = true;
      if (activeFilter === 'Hombros' && part === 'shoulders') matchesMuscle = true;
      if (activeFilter === 'Brazos' && part.includes('arm')) matchesMuscle = true;
      if (activeFilter === 'Abdomen' && part === 'waist') matchesMuscle = true;
    }

    // 2. Equipment Filter
    let matchesEquipment = activeEquipment === 'Todos';
    if (!matchesEquipment) {
      const equip = ex.equipment[0]?.toLowerCase() || '';
      if (activeEquipment === 'Mancuernas' && equip === 'dumbbell') matchesEquipment = true;
      if (activeEquipment === 'Barra' && equip === 'barbell') matchesEquipment = true;
      if (activeEquipment === 'Peso Corporal' && (equip === 'body weight' || equip === 'bodyweight')) matchesEquipment = true;
      if (activeEquipment === 'Polea/Cable' && equip === 'cable') matchesEquipment = true;
      if (activeEquipment === 'Bandas' && equip === 'band') matchesEquipment = true;
    }

    const matchesBoth = matchesMuscle && matchesEquipment;

    if (isCustomizeMode) {
      // Customizer displays all exercises so users can configure them
      return matchesBoth;
    } else {
      // Standard mode only displays exercises enabled in the custom routine
      return matchesBoth && enabledExercises.includes(ex.id);
    }
  });

  const totalRoutineCount = enabledExercises.length;
  const completedRoutineCount = EXERCISES.filter(
    (ex) => enabledExercises.includes(ex.id) && completedExercises.includes(ex.id)
  ).length;

  if (!currentUser) {
    return <LoginScreen onSelectUser={handleSelectUser} />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 font-sans text-neutral-100 flex flex-col items-center justify-center p-0 md:p-6 select-none relative overflow-x-hidden">
      {/* Decorative background gradients to feel premium & athletic */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-brand-yellow/5 rounded-b-[100px] blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-yellow-500/[0.02] rounded-full blur-[100px] pointer-events-none z-0" />

      {/* --- PHONE SHELL WRAPPER --- */}
      <main className="w-full max-w-md bg-brand-dark md:rounded-[40px] md:border-[10px] md:border-neutral-800 shadow-2xl relative flex flex-col min-h-screen md:h-[85vh] md:max-h-[850px] md:min-h-[750px] flex-col justify-between overflow-hidden z-10">
        
        {/* Phone Notch Speaker & Camera for ultra premium mockup feel */}
        <div className="hidden md:flex justify-center absolute top-0 inset-x-0 z-50">
          <div className="bg-neutral-800 h-5 w-40 rounded-b-2xl flex justify-between items-center px-4">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
            <span className="w-16 h-1 rounded-full bg-neutral-950" />
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-900" />
          </div>
        </div>

        {/* Floating Custom Toast Overlay */}
        {toast && (
          <div className="absolute top-16 left-4 right-4 z-50 animate-bounce">
            <div className={`p-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2.5 backdrop-blur-md ${
              toast.type === 'success' 
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                : toast.type === 'yellow'
                  ? 'bg-brand-yellow/15 border-brand-yellow/30 text-brand-yellow'
                  : 'bg-zinc-800/90 border-zinc-700 text-white'
            }`}>
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{toast.message}</span>
            </div>
          </div>
        )}

        {/* --- MAIN HEADER --- */}
        <header className="px-4 pt-6 pb-4 bg-brand-gray/40 border-b border-white/5 sticky top-0 backdrop-blur-lg z-20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-brand-yellow p-1.5 rounded-lg shadow-lg">
              <Dumbbell className="w-4 h-4 text-brand-dark stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-sm tracking-tighter text-white uppercase italic">
                  IMPULSA <span className="text-brand-yellow">FIT</span>
                </span>
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide ${
                  currentUser.plan === 'black' 
                    ? 'bg-brand-yellow text-brand-dark shadow-sm' 
                    : 'bg-white/10 text-white'
                }`}>
                  {currentUser.plan === 'black' ? 'Black' : 'Fit'}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium truncate max-w-[120px]">
                {currentUser.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-yellow animate-ping" />
            <span className="text-[10px] text-brand-yellow font-bold uppercase tracking-wider font-display">
              Técnica Activa
            </span>
          </div>
        </header>

        {/* --- SCROLLABLE CONTENT BODY --- */}
        <section className="flex-1 overflow-y-auto px-4 pt-12 pb-24 flex flex-col gap-5 z-10" id="main-scrollable-content">
          
          {activeTab === 'rutina' ? (
            <>
              {/* Adherence Telemetry Dashboard */}
              <AdherenceStats 
                stats={userStats}
                completedCount={completedRoutineCount}
                totalCount={totalRoutineCount}
              />

              {/* Attendance Check-in Calendar */}
              <AttendanceTracker 
                streak={userStats.streak}
                totalWorkouts={userStats.totalWorkouts}
                lastWorkoutDate={userStats.lastWorkoutDate}
                onRegisterToday={handleRegisterToday}
                isTodayRegistered={isTodayRegistered}
              />

              {/* Section Header: Exercise catalog and routine customizer button */}
              <div className="flex justify-between items-center pt-1">
                <div>
                  <h2 className="text-sm font-display font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
                    <ListTodo className="w-4 h-4 text-brand-yellow" />
                    {isCustomizeMode ? 'Configurar Plan Semanal' : 'Mi Rutina del Día'}
                  </h2>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                    {isCustomizeMode 
                      ? 'Activa o desactiva ejercicios según tu capacidad' 
                      : 'Realiza tus ejercicios programados con buena técnica'
                    }
                  </p>
                </div>

                <button
                  onClick={() => {
                    setIsCustomizeMode(!isCustomizeMode);
                    showToast(
                      isCustomizeMode 
                        ? 'Rutina configurada y guardada exitosamente.' 
                        : 'Modo edición activo: selecciona tus ejercicios predilectos.', 
                      'info'
                    );
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-display font-black uppercase tracking-wider border transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${
                    isCustomizeMode
                      ? 'yellow-gradient text-brand-dark border-brand-yellow shadow-lg'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                  id="toggle-customizer-btn"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.5]" />
                  {isCustomizeMode ? 'Listo' : 'Ajustar'}
                </button>
              </div>

              {/* ADVANCED COHESIVE FILTER PANEL */}
              <div className="bg-brand-gray/40 border border-white/5 rounded-3xl p-4.5 space-y-4 shadow-xl" id="advanced-filter-panel">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-brand-yellow" />
                    <h3 className="text-xs font-display font-black text-white uppercase tracking-wider">
                      Filtros de Búsqueda
                    </h3>
                  </div>
                  {(activeFilter !== 'Todos' || activeEquipment !== 'Todos') && (
                    <button
                      onClick={() => {
                        setActiveFilter('Todos');
                        setActiveEquipment('Todos');
                        showToast('Filtros restablecidos correctamente 🌟', 'info');
                      }}
                      className="text-[10px] text-brand-yellow hover:text-white transition-all font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                {/* MUSCLE FILTERS */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      Grupo Muscular
                    </span>
                    {activeFilter !== 'Todos' && (
                      <span className="text-[9px] text-brand-yellow bg-brand-yellow/10 border border-brand-yellow/20 px-1.5 py-0.2 rounded-full font-bold">
                        {activeFilter}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 py-1" id="filter-chips-muscles">
                    {(['Todos', 'Pecho', 'Espalda', 'Pierna', 'Hombros', 'Brazos', 'Abdomen'] as const).map((category) => {
                      const isSelected = activeFilter === category;
                      return (
                        <button
                          key={category}
                          onClick={() => setActiveFilter(category)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                            isSelected
                              ? 'yellow-gradient text-brand-dark border-brand-yellow shadow-md font-black scale-[1.02]'
                              : 'bg-brand-dark/50 border-white/5 text-neutral-400 hover:text-white hover:border-white/10'
                          }`}
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* EQUIPMENT FILTERS */}
                <div className="space-y-1.5 pt-1 border-t border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      Equipamiento
                    </span>
                    {activeEquipment !== 'Todos' && (
                      <span className="text-[9px] text-brand-yellow bg-brand-yellow/10 border border-brand-yellow/20 px-1.5 py-0.2 rounded-full font-bold">
                        {activeEquipment}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 py-1" id="filter-chips-equipment">
                    {(['Todos', 'Mancuernas', 'Barra', 'Peso Corporal', 'Polea/Cable', 'Bandas'] as const).map((equip) => {
                      const isSelected = activeEquipment === equip;
                      return (
                        <button
                          key={equip}
                          onClick={() => setActiveEquipment(equip)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                            isSelected
                              ? 'yellow-gradient text-brand-dark border-brand-yellow shadow-md font-black scale-[1.02]'
                              : 'bg-brand-dark/50 border-white/5 text-neutral-400 hover:text-white hover:border-white/10'
                          }`}
                        >
                          {equip}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* FILTER RESULTS COUNTER */}
                <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                  <span>Encontrados: {filteredExercises.length} ejercicios</span>
                  {(activeFilter !== 'Todos' || activeEquipment !== 'Todos') && (
                    <span className="text-brand-yellow/80 font-bold">Filtros Activos</span>
                  )}
                </div>
              </div>

              {/* INTERACTIVE EXERCISE LIST */}
              <div className="flex flex-col gap-2.5" id="exercise-list-container">
                {filteredExercises.length > 0 ? (
                  filteredExercises.map((exercise) => (
                    <ExerciseCard 
                      key={exercise.id}
                      exercise={exercise}
                      isCompleted={completedExercises.includes(exercise.id)}
                      isEnabled={enabledExercises.includes(exercise.id)}
                      isCustomizeMode={isCustomizeMode}
                      onToggleEnable={() => handleToggleEnableExercise(exercise.id)}
                      onClick={() => setSelectedExercise(exercise)}
                    />
                  ))
                ) : (
                  <div className="text-center py-10 bg-brand-gray/30 border border-dashed border-white/5 rounded-2xl px-4">
                    <HelpCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <h4 className="text-xs font-bold text-gray-300">No hay ejercicios para mostrar</h4>
                    <p className="text-[10px] text-gray-500 mt-1 max-w-[200px] mx-auto leading-relaxed">
                      {isCustomizeMode 
                        ? 'No se encontraron ejercicios en esta categoría.' 
                        : 'Has desactivado estos ejercicios. Toca "Personalizar" para activarlos.'
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Botón Destacado de Entrenamiento en Serie */}
              {!isCustomizeMode && filteredExercises.length > 0 && (
                <div className="mt-2 pb-4" id="start-series-workout-container">
                  <button
                    onClick={() => setCurrentWorkoutIndex(0)}
                    className="w-full py-4 px-5 rounded-2xl font-display font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl shadow-brand-yellow/10 yellow-gradient text-brand-dark border border-brand-yellow hover:scale-[1.02] active:scale-95 cursor-pointer animate-fade-in"
                    id="start-series-workout-btn"
                  >
                    <Play className="w-4 h-4 fill-brand-dark" />
                    <span>Comenzar Entrenamiento en Serie</span>
                  </button>
                </div>
              )}
            </>
          ) : activeTab === 'coach' ? (
            <AICoachTab
              userStats={userStats}
              leagueIndex={leagueIndex}
              weeklyAttendance={weeklyAttendance}
              completedExercisesCount={completedRoutineCount}
              totalExercisesCount={totalRoutineCount}
              exercises={EXERCISES}
              userPlan={currentUser.plan}
              aiCredits={aiCredits}
              onConsumeCredit={handleConsumeCredit}
              onUpgradeToBlack={handleUpgradeToBlack}
            />
          ) : activeTab === 'ligas' ? (
            <LeagueDashboard 
              leagueIndex={leagueIndex}
              weeklyAttendance={weeklyAttendance}
              weeksTracked={weeksTracked}
              onAddAttendance={handleAddWeeklyAttendance}
              onEndWeek={handleEndWeekSimulation}
              onResetLeagues={handleResetLeaguesSimulation}
              isTodayRegistered={isTodayRegistered}
              onRegisterToday={handleRegisterToday}
            />
          ) : (
            /* --- PROFILE & SETTINGS TAB --- */
            <div className="flex flex-col gap-4 py-2" id="profile-panel">
              {/* User overview */}
              <div className="bg-brand-gray border border-white/5 rounded-2xl p-5 text-center flex flex-col items-center gap-2">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-1 shadow-inner ${
                  currentUser.plan === 'black' 
                    ? 'bg-brand-yellow/20 border-2 border-brand-yellow text-brand-yellow shadow-brand-yellow/20' 
                    : 'bg-brand-yellow/10 border border-brand-yellow/20 text-brand-yellow'
                }`}>
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-display font-bold text-white tracking-wide">{currentUser.name}</h3>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      currentUser.plan === 'black'
                        ? 'bg-brand-yellow text-brand-dark shadow-sm'
                        : 'bg-white/10 text-white border border-white/10'
                    }`}>
                      {currentUser.plan === 'black' ? 'Plan Black 👑' : 'Plan Fit (Básico) ⚡'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {currentUser.plan === 'black' ? 'Consultas IA Ilimitadas · Acceso Total' : `Créditos IA hoy: ${aiCredits}/3 gratuitos`}
                  </p>
                </div>

                <div className="w-full bg-white/5 h-[1px] my-1" />
                
                {currentUser.plan === 'fit' && (
                  <button
                    onClick={handleUpgradeToBlack}
                    className="w-full py-2.5 px-4 rounded-xl yellow-gradient text-brand-dark font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-brand-yellow/15 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer mb-1"
                  >
                    ⭐ Mejorar a Plan Black (Simular)
                  </button>
                )}
                
                <div className="grid grid-cols-2 gap-4 w-full text-center mt-1">
                  <div>
                    <span className="text-2xl font-display font-black text-brand-yellow">{userStats.streak}</span>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5 font-bold">Racha de días</p>
                  </div>
                  <div>
                    <span className="text-2xl font-display font-black text-brand-yellow">{userStats.totalWorkouts}</span>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5 font-bold">Total Asistencias</p>
                  </div>
                </div>
              </div>

              {/* Cerrar Sesión Button */}
              <button
                onClick={handleLogout}
                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-3 px-4 rounded-xl text-xs font-display font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión (Cambiar de Usuario)</span>
              </button>

              {/* Impulsa Fit Philosophy & Guidelines */}
              <div className="bg-brand-gray border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                <h4 className="text-xs font-display font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <Activity className="w-4 h-4 text-brand-yellow" />
                  Misión de Técnica y Activación
                </h4>
                <div className="text-xs text-gray-300 space-y-2.5 leading-relaxed">
                  <p>
                    En <strong>Impulsa Fit</strong>, priorizamos tu progreso constante. La clave para la consistencia y adherencia es entender la biomecánica correcta y activar los grupos musculares deseados de manera óptima.
                  </p>
                  <div className="flex gap-2 items-start bg-brand-dark/40 p-2.5 rounded-xl border border-white/5">
                    <span className="text-brand-yellow font-bold text-base leading-none">1</span>
                    <p className="text-[11px] text-gray-400">
                      <strong>Calentamiento:</strong> Dedica siempre de 5 a 10 minutos a la movilidad articular ligera antes de levantar peso.
                    </p>
                  </div>
                  <div className="flex gap-2 items-start bg-brand-dark/40 p-2.5 rounded-xl border border-white/5">
                    <span className="text-brand-yellow font-bold text-base leading-none">2</span>
                    <p className="text-[11px] text-gray-400">
                      <strong>Conexión Mente-Músculo:</strong> Visualiza el músculo que estás trabajando en la pantalla de "Anatomía Activa" y siente su contracción controlada.
                    </p>
                  </div>
                </div>
              </div>

              {/* Maintenance & Demo Switcher Tools */}
              <div className="bg-brand-gray border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                <h4 className="text-xs font-display font-bold text-white uppercase tracking-wider">Demostración & Ajustes</h4>
                <button
                  onClick={handleLogout}
                  className="w-full bg-brand-yellow/10 hover:bg-brand-yellow/20 text-brand-yellow border border-brand-yellow/30 py-2.5 px-4 rounded-xl text-xs font-display font-bold transition-all cursor-pointer"
                >
                  Cambiar de Perfil (Carlos ↔ Valeria)
                </button>
                <button
                  onClick={handleResetProgress}
                  className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2.5 px-4 rounded-xl text-xs font-display font-bold transition-all cursor-pointer"
                >
                  Reiniciar Historial de Racha y Asistencias
                </button>
              </div>
            </div>
          )}

        </section>

        {/* --- BOTTOM MOBILE TAB BAR NAVIGATION --- */}
        <nav className="absolute bottom-0 inset-x-0 bg-brand-gray/90 backdrop-blur-md border-t border-white/5 py-2.5 px-6 flex justify-around items-center z-20">
          <button
            onClick={() => {
              setActiveTab('rutina');
              setIsCustomizeMode(false);
            }}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === 'rutina' ? 'text-brand-yellow scale-105' : 'text-gray-500 hover:text-gray-300'
            }`}
            aria-label="Ir a mi rutina del día"
          >
            <Home className="w-5 h-5" />
            <span className="text-[9px] font-display font-bold uppercase tracking-wider">Mi Rutina</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('coach');
              setIsCustomizeMode(false);
            }}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === 'coach' ? 'text-brand-yellow scale-105' : 'text-gray-500 hover:text-gray-300'
            }`}
            aria-label="Ir al Coach IA"
          >
            <Bot className="w-5 h-5" />
            <span className="text-[9px] font-display font-bold uppercase tracking-wider">Coach IA</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('ligas');
              setIsCustomizeMode(false);
            }}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === 'ligas' ? 'text-brand-yellow scale-105' : 'text-gray-500 hover:text-gray-300'
            }`}
            aria-label="Ir a las ligas de consistencia"
          >
            <Trophy className="w-5 h-5" />
            <span className="text-[9px] font-display font-bold uppercase tracking-wider">Ligas</span>
          </button>

          <button
            onClick={() => setActiveTab('perfil')}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === 'perfil' ? 'text-brand-yellow scale-105' : 'text-gray-500 hover:text-gray-300'
            }`}
            aria-label="Ir a mi perfil e información"
          >
            <User className="w-5 h-5" />
            <span className="text-[9px] font-display font-bold uppercase tracking-wider">Mi Perfil</span>
          </button>
        </nav>

        {/* --- DETAIL MODAL OVERLAY --- */}
        {selectedExercise && (
          <ExerciseDetail 
            exercise={selectedExercise}
            isCompleted={completedExercises.includes(selectedExercise.id)}
            onClose={() => setSelectedExercise(null)}
            onComplete={() => handleCompleteExercise(selectedExercise.id)}
          />
        )}

        {/* --- SERIES WORKOUT DETAIL OVERLAY --- */}
        {currentWorkoutIndex !== null && currentWorkoutIndex !== 'celebration' && (
          <ExerciseDetail 
            exercise={filteredExercises[currentWorkoutIndex]}
            isCompleted={completedExercises.includes(filteredExercises[currentWorkoutIndex].id)}
            onClose={() => setCurrentWorkoutIndex(null)}
            onComplete={() => handleCompleteSeriesExercise(filteredExercises[currentWorkoutIndex].id)}
            isSeriesMode={true}
            onNext={handleNextWorkout}
            onPrev={handlePrevWorkout}
            currentIndex={currentWorkoutIndex}
            totalExercises={filteredExercises.length}
          />
        )}

        {/* --- SERIES WORKOUT CELEBRATION OVERLAY --- */}
        {currentWorkoutIndex === 'celebration' && (
          <WorkoutCelebration 
            stats={userStats}
            weeklyAttendance={weeklyAttendance}
            leagueName={leagueIndex < LEAGUES.length ? LEAGUES[leagueIndex].name : 'Liga Diamante'}
            completedCount={filteredExercises.length}
            onClose={() => setCurrentWorkoutIndex(null)}
          />
        )}

      </main>

      {/* Outer desktop screen instructions */}
      <div className="hidden md:block text-center mt-4 text-xs text-gray-500 max-w-sm leading-relaxed" id="desktop-instructions">
        <p>
          Simulador de aplicación móvil <strong>Impulsa Fit Pro</strong>. Usa tu mouse o controles táctiles para navegar de manera interactiva.
        </p>
      </div>
    </div>
  );
}
