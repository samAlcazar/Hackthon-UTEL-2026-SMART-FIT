# 🏋️‍♂️ IMPULSA FIT · AI Coach para Smart Fit
> **Proyecto para Hackathon UTEL 2026** — Plataforma de retención y creación de hábitos de entrenamiento impulsada por Inteligencia Artificial de Google Gemini.

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.0_Flash-8E75B2?logo=google&logoColor=white)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

---

## 🎯 El Problema: El Abandono del Gimnasio
El **50% de los nuevos usuarios** abandona el gimnasio durante sus primeros 3 meses. Las razones principales no son la falta de equipo, sino:
1. **Falta de orientación técnica**: Los coaches del gimnasio no pueden atender a todos simultáneamente.
2. **Incertidumbre en la rutina**: Los principiantes no saben qué ejercicio hacer ni qué músculo deben sentir.
3. **Pérdida de motivación**: Ausencia de seguimiento diario y creación de hábitos sostenibles.

---

## 💡 La Solución: Entrenador IA en Tiempo Real
**Impulsa Fit** no es otra app para anotar pesos. Es una **plataforma inteligente de retención** donde la IA actúa como un acompañante constante:

### 1. 🤖 Coach de Ejercicio en Contexto
- Integrado directamente en la guía técnica de cada ejercicio.
- Conoce la biomecánica, músculos objetivo, secundarios e instrucciones paso a paso.
- Responde dudas en tiempo real con **streaming de Google Gemini 2.0 Flash** (o motor de respaldo offline sin API).
- Lector de voz guiado (**Text-to-Speech**) para entrenar sin mirar la pantalla.

### 2. 🧠 Coach Personal en Barra Inferior
- Chat persistente que recuerda el estado del usuario.
- Lee en vivo la racha de días, ejercicios completados hoy y liga de consistencia.
- Brinda apoyo empático y sin juicios negativos para mantener la adherencia.

### 3. 🥇 Sistema de Ligas y Telemetría de Adherencia
- Gamificación por consistencia (Liga Bronce, Plata, Oro, Platino, Diamante).
- Panel interactivo de **Nivel de Adherencia** con porcentaje de progreso diario y racha acumulada.

---

## 💰 Modelo de Negocio & Viabilidad Financiera (Freemium)

Simulamos un modelo de negocio rentable para Smart Fit demostrando alto impacto con mínimo costo operacional:

| Plan | Acceso a IA | Estrategia de Monetización |
| :--- | :--- | :--- |
| **Plan Fit (Básico)** | 3 consultas diarias gratuitas | Genera enganche inicial y muestra el valor del servicio. |
| **Plan Black (Premium)** | Consultas Ilimitadas + Asistencia Total | **Driver de Upgrade**: Impulsa la conversión al Plan Black (+$10 USD/mes). |

### 📈 Margen de Ganancia Neto:
- **Costo de IA por usuario (Gemini 2.0 Flash)**: `~$0.004 USD / mes` (~$0.07 MXN).
- **Ingreso adicional por upgrade a Plan Black**: `+$10.00 USD / mes`.
- **Margen de beneficio en la función de IA**: **> 99.9%**.

---

## 🚀 Perfiles de Prueba Simulados en la App

Al iniciar la app se puede alternar entre dos perfiles de prueba para evaluar la experiencia:

1. **⚡ Carlos Mendoza (Plan Fit - Básico)**:
   - 3 consultas gratuitas al día.
   - Demuestra el límite de créditos y la pantalla de *Upsell* hacia Plan Black.
2. **👑 Valeria Rojas (Plan Black - Premium)**:
   - Consultas ilimitadas con el Coach IA.
   - Insignia dorada y acceso completo a todas las funciones.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Build Tool**: Vite.
- **AI Engine**: `@google/genai` (Google Gemini 2.0 Flash Stream SDK).
- **Audio**: Web Speech Synthesis API (Audio-Guía en español).
- **Storage**: LocalStorage API para persistencia de chats, series y racha.

---

## ⚡ Instalación y Ejecución Local

### Prerrequisitos
- Node.js (v18 o superior)
- npm o pnpm

### Pasos
1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/Hackthon-UTEL-2026-SMART-FIT.git
   cd Hackthon-UTEL-2026-SMART-FIT
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar la API Key de Gemini (Opcional):**
   Crea un archivo `.env.local` en la raíz con tu clave de API:
   ```env
   VITE_GEMINI_API_KEY=tu_api_key_de_google_ai_studio
   ```
   *(Nota: Si no agregas la clave, la app activará automáticamente el motor de respuesta inteligente en local).*

4. **Ejecutar en modo desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📄 Licencia

Este proyecto está bajo la Licencia [Apache 2.0](LICENSE).
