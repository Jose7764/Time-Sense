"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  calculateColorScore,
  generateColorSet,
  hsbToCss
} from "@/lib/colors";
import MemoryDotsGame from "@/components/MemoryDotsGame";
import MotionPredictionGame from "@/components/MotionPredictionGame";

const difficulties = [
  { id: "easy", label: "Facil", time: 5, description: "5 segundos" },
  { id: "medium", label: "Medio", time: 3, description: "3 segundos" },
  { id: "hard", label: "Dificil", time: 1.5, description: "1.5 segundos" }
];

const initialAttempt = {
  hue: 180,
  saturation: 70,
  brightness: 70
};

export default function HomePage() {
  const [selectedGame, setSelectedGame] = useState(null);

  return (
    <main className="min-h-screen bg-[#f6f3ec] px-4 py-6 text-[#17211d] sm:px-6 lg:px-10">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d8d1c2] pb-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-700">
              Perception Lab
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-5xl">
              Desafios rapidos de precisao
            </h1>
          </div>
          {selectedGame && (
            <button
              type="button"
              onClick={() => setSelectedGame(null)}
              className="inline-flex h-11 items-center justify-center rounded-md border border-[#c9c0ae] bg-white/70 px-4 font-semibold transition hover:border-teal-600 hover:text-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-200"
            >
              Trocar jogo
            </button>
          )}
        </header>

        {!selectedGame && <GameSelection onSelect={setSelectedGame} />}
        {selectedGame === "colors" && <ColorMemoryGame />}
        {selectedGame === "timer" && <TimerGame />}
        {selectedGame === "dots" && <MemoryDotsGame />}
        {selectedGame === "motion" && <MotionPredictionGame />}
      </section>
    </main>
  );
}

function GameSelection({ onSelect }) {
  return (
    <div className="flex flex-1 items-center justify-center py-8">
      <div className="grid w-full max-w-5xl items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <GameCard
        title="Jogo de memoria de cores"
        description="Memorize uma cor por vez e tente recria-la com matiz, saturacao e brilho."
        detail="5 cores / 50 pontos"
        buttonLabel="Jogar cores"
        onClick={() => onSelect("colors")}
      />
      <GameCard
        title="Pare no tempo certo"
        description="Veja o tempo alvo, inicie o cronometro oculto e pare quando sentir que chegou."
        detail="0 a 10 segundos / 100 pontos"
        buttonLabel="Jogar tempo"
        onClick={() => onSelect("timer")}
      />
      <GameCard
        title="Memory Dots"
        description="Memorize a ordem em que as bolinhas aparecem e clique nelas na sequencia correta."
        detail="Sequencia infinita"
        buttonLabel="Jogar dots"
        onClick={() => onSelect("dots")}
      />
      <GameCard
        title="Motion Prediction"
        description="Observe um objeto em movimento, espere ele sumir e clique onde ele deveria estar."
        detail="12 rodadas / 100 pontos cada"
        buttonLabel="Jogar movimento"
        onClick={() => onSelect("motion")}
      />
      </div>
    </div>
  );
}

function GameCard({ title, description, detail, buttonLabel, onClick }) {
  return (
    <article className="flex h-full min-h-[260px] flex-col rounded-lg border border-[#d8d1c2] bg-white/75 p-5 shadow-sm">
      <div className="flex flex-1 flex-col">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
          {detail}
        </p>
        <h2 className="mt-3 text-xl font-bold leading-tight">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-[#4c5a54]">{description}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md bg-teal-700 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-200"
      >
        {buttonLabel}
      </button>
    </article>
  );
}

function ColorMemoryGame() {
  const [phase, setPhase] = useState("start");
  const [selectedDifficulty, setSelectedDifficulty] = useState(difficulties[1]);
  const [targetColors, setTargetColors] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAttempt, setCurrentAttempt] = useState(initialAttempt);

  const isComplete = attempts.length === 5;
  const currentColor = targetColors[currentIndex];

  useEffect(() => {
    if (phase !== "memorize" || !currentColor) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setPhase("guess");
    }, selectedDifficulty.time * 1000);

    return () => window.clearTimeout(timerId);
  }, [currentColor, phase, selectedDifficulty.time]);

  const results = useMemo(() => {
    return targetColors.map((color, index) => ({
      original: color,
      attempt: attempts[index]?.color,
      score: attempts[index]?.score ?? 0
    }));
  }, [attempts, targetColors]);

  const totalScore = useMemo(() => {
    const sum = results.reduce((total, item) => total + item.score, 0);
    return Math.min(50, Number(sum.toFixed(1)));
  }, [results]);

  function startGame() {
    const colors = generateColorSet(5);

    setTargetColors(colors);
    setAttempts([]);
    setCurrentIndex(0);
    setCurrentAttempt(initialAttempt);
    setPhase("memorize");
  }

  function saveAttempt() {
    const score = calculateColorScore(currentColor, currentAttempt);
    const nextAttempts = [
      ...attempts,
      {
        color: currentAttempt,
        score
      }
    ];

    setAttempts(nextAttempts);
    setCurrentAttempt(initialAttempt);
    setPhase("feedback");
  }

  function continueAfterFeedback() {
    const nextIndex = currentIndex + 1;

    if (nextIndex >= targetColors.length) {
      setPhase("result");
      return;
    }

    setCurrentIndex(nextIndex);
    setPhase("memorize");
  }

  function resetGame() {
    setPhase("start");
    setTargetColors([]);
    setAttempts([]);
    setCurrentIndex(0);
    setCurrentAttempt(initialAttempt);
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            Memoria cromatica
          </p>
          <h2 className="mt-1 text-2xl font-bold">Recrie as cores de memoria</h2>
        </div>
        <div className="rounded-full bg-[#17211d] px-4 py-2 text-sm font-semibold text-white">
          5 cores / 50 pontos
        </div>
      </div>
        {phase === "start" && (
          <StartScreen
            selectedDifficulty={selectedDifficulty}
            setSelectedDifficulty={setSelectedDifficulty}
            onStart={startGame}
          />
        )}

        {phase === "memorize" && (
          <MemorizeScreen
            color={currentColor}
            currentIndex={currentIndex}
            seconds={selectedDifficulty.time}
          />
        )}

        {phase === "guess" && (
          <GuessScreen
            currentAttempt={currentAttempt}
            currentIndex={currentIndex}
            onChange={setCurrentAttempt}
            onConfirm={saveAttempt}
          />
        )}

        {phase === "feedback" && attempts[currentIndex] && (
          <FeedbackScreen
            currentIndex={currentIndex}
            originalColor={targetColors[currentIndex]}
            attempt={attempts[currentIndex]}
            isLastColor={currentIndex === targetColors.length - 1}
            onContinue={continueAfterFeedback}
          />
        )}

        {phase === "result" && isComplete && (
          <ResultsScreen
            results={results}
            totalScore={totalScore}
            onRestart={resetGame}
          />
        )}
    </>
  );
}

function TimerGame() {
  const [timerGameState, setTimerGameState] = useState("ready");
  const [targetTime, setTargetTime] = useState(() => generateTargetTime());
  const [stoppedTime, setStoppedTime] = useState(null);
  const startTimeRef = useRef(null);

  const difference =
    stoppedTime === null ? null : Math.abs(stoppedTime - targetTime);
  const score =
    difference === null ? null : Math.max(0, Math.round(100 - difference * 20));

  function startTimer() {
    startTimeRef.current = performance.now();
    setStoppedTime(null);
    setTimerGameState("running");
  }

  function stopTimer() {
    if (startTimeRef.current === null) {
      return;
    }

    const elapsed = (performance.now() - startTimeRef.current) / 1000;

    setStoppedTime(elapsed);
    setTimerGameState("result");
  }

  function resetTimerGame() {
    startTimeRef.current = null;
    setTargetTime(generateTargetTime());
    setStoppedTime(null);
    setTimerGameState("ready");
  }

  return (
    <div className="flex flex-1 flex-col justify-center py-10">
      <div className="mx-auto w-full max-w-3xl rounded-lg border border-[#d8d1c2] bg-white/75 p-6 shadow-sm sm:p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            Pare no tempo certo
          </p>
          <h2 className="mt-2 text-3xl font-bold">
            Pare em {targetTime.toFixed(2)}s
          </h2>
        </div>

        {timerGameState === "ready" && (
          <div className="mt-8">
            <p className="max-w-xl text-lg leading-8 text-[#4c5a54]">
              Quando iniciar, o cronometro vai correr escondido. Clique em parar
              quando achar que chegou ao tempo alvo.
            </p>
            <button
              type="button"
              onClick={startTimer}
              className="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-teal-700 px-6 font-bold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-200"
            >
              Iniciar
            </button>
          </div>
        )}

        {timerGameState === "running" && (
          <div className="mt-8">
            <div className="rounded-lg border border-[#d8d1c2] bg-[#f6f3ec] p-5">
              <p className="text-xl font-bold">O tempo esta correndo...</p>
              <p className="mt-2 text-[#4c5a54]">
                Pare quando achar que chegou em {targetTime.toFixed(2)}s.
              </p>
            </div>
            <button
              type="button"
              onClick={stopTimer}
              className="mt-8 inline-flex h-14 w-full items-center justify-center rounded-md bg-[#17211d] px-6 text-lg font-bold text-white shadow-sm transition hover:bg-[#26342f] focus:outline-none focus:ring-4 focus:ring-stone-300 sm:w-auto"
            >
              Parar
            </button>
          </div>
        )}

        {timerGameState === "result" && (
          <div className="mt-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <TimerStatCard label="Tempo alvo" value={`${targetTime.toFixed(2)}s`} />
              <TimerStatCard
                label="Voce parou em"
                value={`${stoppedTime.toFixed(2)}s`}
              />
              <TimerStatCard
                label="Diferenca"
                value={`${difference.toFixed(2)}s`}
              />
              <TimerStatCard label="Pontuacao" value={`${score} / 100`} strong />
            </div>
            <button
              type="button"
              onClick={resetTimerGame}
              className="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-teal-700 px-6 font-bold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-200"
            >
              Jogar novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TimerStatCard({ label, value, strong = false }) {
  return (
    <div className="rounded-lg border border-[#d8d1c2] bg-[#f6f3ec] p-4">
      <p className="text-sm font-semibold text-[#5f6b66]">{label}</p>
      <p className={`mt-2 font-bold ${strong ? "text-3xl" : "text-2xl"}`}>
        {value}
      </p>
    </div>
  );
}

function generateTargetTime() {
  return Number((Math.random() * 10).toFixed(2));
}

function FeedbackScreen({
  currentIndex,
  originalColor,
  attempt,
  isLastColor,
  onContinue
}) {
  return (
    <div className="flex flex-1 flex-col justify-center py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
            Resultado da cor {currentIndex + 1} de 5
          </p>
          <h2 className="mt-2 text-3xl font-bold">
            Voce fez {attempt.score.toFixed(1)} / 10
          </h2>
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex h-12 items-center justify-center rounded-md bg-teal-700 px-6 font-bold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-200"
        >
          {isLastColor ? "Ver resultado final" : "Proxima cor"}
        </button>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1fr_140px]">
        <ResultSwatch label="Cor original" color={originalColor} />
        <ResultSwatch label="Sua cor" color={attempt.color} />
        <div>
          <p className="mb-2 font-semibold">Diferenca visual</p>
          <div className="grid h-20 grid-cols-2 overflow-hidden rounded-md border border-black/10 shadow-sm lg:h-24">
            <div
              style={{ backgroundColor: hsbToCss(originalColor) }}
              aria-label="Metade com a cor original"
            />
            <div
              style={{ backgroundColor: hsbToCss(attempt.color) }}
              aria-label="Metade com a cor escolhida"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StartScreen({ selectedDifficulty, setSelectedDifficulty, onStart }) {
  return (
    <div className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[1fr_420px]">
      <div className="max-w-2xl">
        <p className="text-lg leading-8 text-[#4c5a54]">
          Observe uma cor por vez, guarde o maximo que conseguir e depois
          ajuste matiz, saturacao e brilho para chegar perto do original.
        </p>
        <button
          type="button"
          onClick={onStart}
          className="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-teal-700 px-6 font-bold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-200"
        >
          Comecar jogo
        </button>
      </div>

      <div className="rounded-lg border border-[#d8d1c2] bg-white/70 p-4 shadow-sm">
        <h2 className="text-lg font-bold">Dificuldade</h2>
        <div className="mt-4 grid gap-3">
          {difficulties.map((difficulty) => {
            const isSelected = selectedDifficulty.id === difficulty.id;

            return (
              <button
                key={difficulty.id}
                type="button"
                onClick={() => setSelectedDifficulty(difficulty)}
                className={`flex items-center justify-between rounded-md border p-4 text-left transition ${
                  isSelected
                    ? "border-teal-700 bg-teal-50"
                    : "border-[#d8d1c2] bg-white hover:border-teal-400"
                }`}
              >
                <span className="font-semibold">{difficulty.label}</span>
                <span className="text-sm text-[#5f6b66]">
                  {difficulty.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MemorizeScreen({ color, currentIndex, seconds }) {
  return (
    <div className="flex flex-1 flex-col justify-center py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
            Cor {currentIndex + 1} de 5
          </p>
          <h2 className="mt-2 text-2xl font-bold">Memorize esta cor</h2>
          <p className="mt-2 text-[#5f6b66]">
            Esta cor some em {seconds} segundos.
          </p>
        </div>
      </div>
      <div
        className="mx-auto aspect-square w-full max-w-sm rounded-lg border border-black/10 shadow-sm sm:max-w-md"
        style={{ backgroundColor: hsbToCss(color) }}
        aria-label={`Cor para memorizar ${currentIndex + 1}`}
      />
    </div>
  );
}

function GuessScreen({ currentAttempt, currentIndex, onChange, onConfirm }) {
  const hueGradient =
    "linear-gradient(to right, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%))";
  const saturationGradient = `linear-gradient(to right, hsl(${currentAttempt.hue}, 0%, ${currentAttempt.brightness / 2}%), hsl(${currentAttempt.hue}, 100%, ${currentAttempt.brightness / 2}%))`;
  const brightnessGradient = `linear-gradient(to right, hsl(${currentAttempt.hue}, ${currentAttempt.saturation}%, 0%), hsl(${currentAttempt.hue}, ${currentAttempt.saturation}%, 50%), hsl(${currentAttempt.hue}, ${currentAttempt.saturation}%, 100%))`;

  return (
    <div className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[360px_1fr]">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
          Cor {currentIndex + 1} de 5
        </p>
        <h2 className="mt-2 text-2xl font-bold">Ajuste sua tentativa</h2>
        <div
          className="mt-6 aspect-square rounded-lg border border-[#d8d1c2] shadow-sm"
          style={{ backgroundColor: hsbToCss(currentAttempt) }}
          aria-label="Previa da cor escolhida"
        />
      </div>

      <div className="rounded-lg border border-[#d8d1c2] bg-white/75 p-5 shadow-sm">
        <ColorSlider
          label="Matiz"
          value={currentAttempt.hue}
          min={0}
          max={360}
          suffix="deg"
          trackBackground={hueGradient}
          onChange={(value) => onChange({ ...currentAttempt, hue: value })}
        />
        <ColorSlider
          label="Saturacao"
          value={currentAttempt.saturation}
          min={0}
          max={100}
          suffix="%"
          trackBackground={saturationGradient}
          onChange={(value) =>
            onChange({ ...currentAttempt, saturation: value })
          }
        />
        <ColorSlider
          label="Brilho"
          value={currentAttempt.brightness}
          min={0}
          max={100}
          suffix="%"
          trackBackground={brightnessGradient}
          onChange={(value) =>
            onChange({ ...currentAttempt, brightness: value })
          }
        />
        <button
          type="button"
          onClick={onConfirm}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-md bg-[#17211d] px-5 font-bold text-white transition hover:bg-[#26342f] focus:outline-none focus:ring-4 focus:ring-stone-300"
        >
          Confirmar cor
        </button>
      </div>
    </div>
  );
}

function ResultsScreen({ results, totalScore, onRestart }) {
  return (
    <div className="flex flex-1 flex-col py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
            Resultado
          </p>
          <h2 className="mt-2 text-3xl font-bold">
            {totalScore.toFixed(1)} / 50 pontos
          </h2>
        </div>
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex h-12 items-center justify-center rounded-md bg-teal-700 px-6 font-bold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-200"
        >
          Jogar novamente
        </button>
      </div>

      <div className="mt-8 grid gap-4">
        {results.map((item, index) => (
          <div
            key={`${item.original.hue}-${index}`}
            className="grid gap-4 rounded-lg border border-[#d8d1c2] bg-white/75 p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto]"
          >
            <ResultSwatch label="Original" color={item.original} />
            <ResultSwatch label="Sua cor" color={item.attempt} />
            <div className="flex min-w-28 items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
              <span className="text-sm text-[#5f6b66]">Pontuacao</span>
              <strong className="text-2xl">{item.score.toFixed(1)}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ColorSlider({
  label,
  value,
  min,
  max,
  suffix,
  trackBackground,
  onChange
}) {
  return (
    <label className="mb-5 block last:mb-0">
      <span className="mb-2 flex items-center justify-between gap-4">
        <span className="font-semibold">{label}</span>
        <span className="rounded bg-[#edf0e7] px-2 py-1 text-sm text-[#4c5a54]">
          {value}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="color-range w-full"
        style={{ background: trackBackground }}
      />
    </label>
  );
}

function ResultSwatch({ label, color }) {
  return (
    <div className="grid grid-cols-[88px_1fr] items-center gap-4">
      <div
        className="h-20 rounded-md border border-black/10 shadow-sm"
        style={{ backgroundColor: hsbToCss(color) }}
      />
      <div>
        <p className="font-semibold">{label}</p>
        <p className="mt-1 text-sm text-[#5f6b66]">
          H {color.hue} / S {color.saturation} / B {color.brightness}
        </p>
      </div>
    </div>
  );
}
