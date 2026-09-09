# ⚡ APEX RECOMP // WebApp de Seguimiento Fitness (PPL x2)

Aplicación web moderna, motivadora y mobile-first construida con **Angular Standalone (Signals + OnPush)** para el seguimiento integral del plan de recomposición corporal (pérdida de grasa con máxima retención de masa magra) entre el **9 de septiembre y el 31 de diciembre de 2026**.

---

## 🚀 Características Principales

### 1. Centro de Mando Diario (`/hoy`)
- **Detección del día**: Muestra automáticamente qué sesión del split PPL x2 corresponde hoy según el día de la semana (Lunes: Push 1, Martes: Pull 1, Miércoles: Legs 1, Jueves: Push 2, Viernes: Pull 2, Sábado: Legs 2, Domingo: Descanso/Cardio). Permite navegar a días anteriores o siguientes.
- **Checklist Interactivo**: Marca ejercicios completados e introduce directamente peso y repeticiones logradas.
- **Suplementación**: Checkbox diario con dosis clínicas y recomendaciones (Creatina 3-5g, Zinc 11mg, Vitamina C 90-500mg).
- **Hidratación**: Contador interactivo de agua en vasos de 250ml (meta diaria de 3.0L) con barra de nivel reactiva.
- **Anillo de Progreso**: Anillo SVG animado con porcentaje en tiempo real y **celebración con confetti** al alcanzar el 100%.
- **Racha de Días (Streak)**: Indicador de constancia activa (`🔥 X días seguidos`).

### 2. Rutina Semanal & Sobrecarga Progresiva (`/rutina`)
- Vista completa del split de 6 días con series y rangos de repeticiones objetivo.
- **Motor de Sobrecarga Progresiva**: Recupera automáticamente las cargas de la sesión previa (*"La semana pasada: 60kg x 8 reps"*) y sugiere la siguiente progresión (+1 repetición o microcarga de peso).
- **Historial por Ejercicio**: Registro cronológico de evolución de marcas y comparativa de delta de carga (+/- kg).

### 3. Nutrición & Macros (`/nutricion`)
- **Metas Iniciales Precargadas**: 2150 kcal/día, 168g Proteína (~2.2g/kg), 60g Grasas (~0.8g/kg), 235g Carbohidratos.
- **Ajuste Dinámico**: Modal para recalcular calorías y macros durante el proceso de recomposición.
- **Registro Diario de Ingesta**: Control de calorías y macros consumidos vs restantes con barras de progreso.
- **Guía de Suplementación**: Horarios óptimos y fundamentación (Creatina diaria consistente, Zinc con comida sólida, Vitamina C dividida).

### 4. Progreso, Gráficos & Fotos (`/progreso`)
- **Peso Corporal**:
  - Gráfico interactivo en **Chart.js** con pesajes diarios y **curva de media móvil semanal superpuesta** (para ignorar fluctuaciones diarias de agua y evaluar la tendencia real).
  - **Semáforo Inteligente de Ritmo**: Compara el % semanal contra el rango objetivo (0.5% - 1.0%/semana) con alertas honestas:
    - *¡Ritmo Óptimo! 🔥 (-0.5% a -1.0%/semana)*
    - *Ritmo Moderado / Lento ⏱️ (<0.5%/semana)*
    - *Pérdida Muy Acelerada ⚠️ (>1.0%/semana)*
- **Medidas Antropométricas**: Registro quincenal de cintura, cadera, brazo, pierna y pecho con tabla comparativa.
- **Fotos de Progreso (IndexedDB)**:
  - Almacenamiento seguro en IndexedDB (sin límites restrictivos de localStorage).
  - **Modo Comparador Lado a Lado (Side-by-Side)**: Compara visualmente dos fotos (ej. Semana 1 vs Semana actual).

### 5. Hoja de Ruta (`/roadmap`)
- Cronograma de 16 semanas dividido en 3 fases:
  1. **Fase 1 (Septiembre)**: Adaptación, consistencia y saturación de creatina.
  2. **Fase 2 (Octubre - Noviembre)**: Déficit sostenido y sobrecarga progresiva estricta.
  3. **Fase 3 (Diciembre)**: Evaluación final, fotos comparativas y transición a mantenimiento.
- Marcador de tiempo transcurrido / días restantes e hitos desbloqueables.

### 6. Persistencia & Respaldo Local (Sin Servidor)
- **100% Privado y Local**: No requiere login, cuentas ni servidor.
- Sincronización automática de Signals contra `localStorage` mediante `effect()`.
- **Exportar / Importar Respaldo (JSON)**: Botón en la cabecera para descargar un archivo JSON completo de copia de seguridad o restaurarlo en cualquier navegador.

---

## 🛠️ Stack Técnico

- **Angular 18+ (22.x)** con Standalone Components (sin NgModules).
- **Signals reactivos** (`signal()`, `computed()`, `effect()`) y `inject()`.
- **ChangeDetectionStrategy.OnPush** en el 100% de los componentes para máxima eficiencia.
- **Chart.js** para analítica y visualización de tendencias de peso.
- **canvas-confetti** para micro-interacciones gamificadas.
- **IndexedDB** para fotos de progreso de alta resolución.
- **SCSS moderno** con CSS Custom Properties (paleta oscura estilo dashboard de gimnasio de alto rendimiento).

---

## 🏃 Cómo Ejecutar el Proyecto Localmente

1. Navegar a la carpeta del proyecto:
   ```bash
   cd /Users/josephhermann/.gemini/antigravity/scratch/fitness-tracker
   ```

2. Instalar dependencias (si no se han instalado previamente):
   ```bash
   npm install
   ```

3. Iniciar el servidor de desarrollo:
   ```bash
   npm start
   # o bien: npx ng serve --open
   ```

4. Abrir en el navegador:
   ```
   http://localhost:4200
   ```

---

## 📦 Compilación para Producción

```bash
npm run build
```
Los archivos optimizados se generarán en la carpeta `dist/fitness-tracker`.
