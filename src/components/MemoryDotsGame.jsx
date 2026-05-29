"use client";

import { useEffect, useRef, useState } from "react";

const ACCEPT_RADIUS = 40;
const DOT_MARGIN = 8;
const MIN_DISTANCE = 14;

export default function MemoryDotsGame() {
  const [gameState, setGameState] = useState("ready");
  const [gameMode, setGameMode] = useState("normal");
  const [memorySequence, setMemorySequence] = useState([]);
  const [inputIndex, setInputIndex] = useState(0);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [bestSequence, setBestSequence] = useState(0);
  const areaRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    const storedBest = window.localStorage.getItem("memory-dots-best");
    setBestSequence(storedBest ? Number(storedBest) : 0);
  }, []);

  useEffect(() => {
    if (gameState !== "input") {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setElapsedTime(getElapsedSeconds(startTimeRef.current));
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [gameState]);

  function startGame() {
    const firstDot = createDot([], 1);

    startTimeRef.current = performance.now();
    setMemorySequence([firstDot]);
    setRoundsCompleted(0);
    setInputIndex(0);
    setElapsedTime(0);
    setGameState("input");
  }

  function handleAreaClick(event) {
    if (gameState !== "input") {
      return;
    }

    const rect = areaRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    const expectedDot = memorySequence[inputIndex];
    const expectedX = (expectedDot.x / 100) * rect.width;
    const expectedY = (expectedDot.y / 100) * rect.height;
    const distance = Math.sqrt(
      (clickX - expectedX) ** 2 + (clickY - expectedY) ** 2
    );

    if (distance > ACCEPT_RADIUS) {
      finishGame();
      return;
    }

    const nextInputIndex = inputIndex + 1;

    if (nextInputIndex < memorySequence.length) {
      setInputIndex(nextInputIndex);
      return;
    }

    const completed = memorySequence.length;
    const nextSequence = [
      ...memorySequence,
      createDot(memorySequence, memorySequence.length + 1)
    ];

    setRoundsCompleted(completed);
    setMemorySequence(nextSequence);
    setInputIndex(0);
    setGameState("input");
  }

  function finishGame() {
    const finalTime = getElapsedSeconds(startTimeRef.current);
    const maxSequence = memorySequence.length;

    setElapsedTime(finalTime);
    setBestSequence((currentBest) => {
      const nextBest = Math.max(currentBest, maxSequence);
      window.localStorage.setItem("memory-dots-best", String(nextBest));
      return nextBest;
    });
    setGameState("gameover");
  }

  function resetGame() {
    startTimeRef.current = null;
    setMemorySequence([]);
    setInputIndex(0);
    setRoundsCompleted(0);
    setElapsedTime(0);
    setGameState("ready");
  }

  const shouldRenderDots = gameState === "input";
  const maxSequence = memorySequence.length;

  return (
    <div className="py-8">
      <section className="overflow-hidden rounded-lg border border-white/10 bg-[#101415] text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">
              Memory Dots
            </p>
            <h2 className="mt-1 text-2xl font-bold">
              Memorize a sequencia das bolinhas
            </h2>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-sm">
            <DarkStat label="Rodada" value={memorySequence.length || 1} />
            <DarkStat
              label="Sequencia"
              value={
                gameState === "input"
                  ? `${inputIndex + 1}/${memorySequence.length}`
                  : "--"
              }
            />
            <DarkStat label="Modo" value={gameMode === "normal" ? "Normal" : "Hard"} />
            <DarkStat label="Score" value={roundsCompleted} />
          </div>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_260px] lg:p-6">
          <button
            ref={areaRef}
            type="button"
            onClick={handleAreaClick}
            className="relative min-h-[420px] overflow-hidden rounded-lg border border-white/10 bg-[#0b0e10] text-left shadow-inner outline-none focus-visible:ring-4 focus-visible:ring-teal-300/30 sm:min-h-[520px]"
            aria-label="Area do jogo Memory Dots"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(45,212,191,0.14),transparent_28%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.08),transparent_24%)]" />

            {shouldRenderDots &&
              memorySequence.map((dot, index) => (
                <span
                  key={dot.id}
                  className={`absolute grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-xs font-bold transition duration-300 ${
                    index < inputIndex && gameState === "input"
                      ? "scale-125 bg-teal-200 text-[#06100f] shadow-[0_0_32px_rgba(94,234,212,0.95)]"
                      : "bg-white text-[#101415] shadow-[0_0_24px_rgba(255,255,255,0.8)]"
                  } ${index === memorySequence.length - 1 ? "animate-pulse" : ""}`}
                  style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
                >
                  {gameMode === "normal" ? dot.id : ""}
                </span>
              ))}
          </button>

          <aside className="flex flex-col justify-between rounded-lg border border-white/10 bg-white/[0.06] p-5">
            <div>
              <p className="text-sm font-semibold text-teal-200">Tempo total</p>
              <p className="mt-2 text-4xl font-bold">
                {elapsedTime.toFixed(1)}s
              </p>

              <div className="mt-6 rounded-md border border-white/10 bg-black/20 p-4">
                <p className="font-semibold">{getDotsStatusText(gameState)}</p>
                <p className="mt-2 text-sm text-white/58">
                  Recorde: {bestSequence}
                </p>
              </div>
            </div>

            {gameState === "ready" && (
              <div className="mt-6">
                <div className="grid grid-cols-2 gap-2 rounded-md border border-white/10 bg-black/20 p-1">
                  <ModeButton
                    active={gameMode === "normal"}
                    label="Normal"
                    onClick={() => setGameMode("normal")}
                  />
                  <ModeButton
                    active={gameMode === "hard"}
                    label="Hard"
                    onClick={() => setGameMode("hard")}
                  />
                </div>
                <button
                  type="button"
                  onClick={startGame}
                  className="mt-4 h-12 w-full rounded-md bg-teal-300 px-5 font-bold text-[#0b0e10] transition hover:bg-teal-200 focus:outline-none focus:ring-4 focus:ring-teal-300/30"
                >
                  Iniciar
                </button>
              </div>
            )}

            {gameState === "gameover" && (
              <div className="mt-6">
                <div className="grid gap-3">
                  <DarkResult label="Rodadas completadas" value={roundsCompleted} />
                  <DarkResult label="Tempo sobrevivido" value={`${elapsedTime.toFixed(2)}s`} />
                  <DarkResult label="Maior sequencia" value={maxSequence} />
                </div>
                <button
                  type="button"
                  onClick={resetGame}
                  className="mt-6 h-12 w-full rounded-md bg-teal-300 px-5 font-bold text-[#0b0e10] transition hover:bg-teal-200 focus:outline-none focus:ring-4 focus:ring-teal-300/30"
                >
                  Jogar novamente
                </button>
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}

function DarkStat({ label, value }) {
  return (
    <div className="min-w-20 rounded-md bg-white/[0.08] px-3 py-2">
      <p className="text-white/58">{label}</p>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function ModeButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 rounded px-3 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-teal-300/30 ${
        active
          ? "bg-teal-300 text-[#0b0e10]"
          : "text-white/68 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function DarkResult({ label, value }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-3">
      <p className="text-sm text-white/58">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function getDotsStatusText(state) {
  if (state === "input") {
    return "Clique na sequencia correta.";
  }

  if (state === "gameover") {
    return "Fim de jogo.";
  }

  return "Escolha o modo e inicie.";
}

function createDot(existingDots, id) {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const dot = {
      id,
      x: randomBetween(DOT_MARGIN, 100 - DOT_MARGIN),
      y: randomBetween(DOT_MARGIN, 100 - DOT_MARGIN)
    };

    const isFarEnough = existingDots.every((existingDot) => {
      const distance = Math.sqrt(
        (dot.x - existingDot.x) ** 2 + (dot.y - existingDot.y) ** 2
      );

      return distance >= MIN_DISTANCE;
    });

    if (isFarEnough) {
      return dot;
    }
  }

  return {
    id,
    x: randomBetween(DOT_MARGIN, 100 - DOT_MARGIN),
    y: randomBetween(DOT_MARGIN, 100 - DOT_MARGIN)
  };
}

function randomBetween(min, max) {
  return Number((min + Math.random() * (max - min)).toFixed(2));
}

function getElapsedSeconds(startTime) {
  if (startTime === null) {
    return 0;
  }

  return (performance.now() - startTime) / 1000;
}
