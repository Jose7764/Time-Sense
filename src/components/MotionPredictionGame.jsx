"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const ROUND_LIMIT = 12;
const ARENA_WIDTH = 700;
const ARENA_HEIGHT = 500;
const BLUE_BALL_SIZE = 18;
const RED_BALL_SIZE = 28;
const HIT_STREAK_THRESHOLD = 85;

const motionDifficulties = [
  {
    id: "easy",
    label: "Easy",
    speed: 150,
    visibleMin: 2600,
    visibleMax: 4000,
    hiddenMin: 1000,
    hiddenMax: 1400,
    description: "Mais lento, janela mais confortavel"
  },
  {
    id: "medium",
    label: "Medium",
    speed: 220,
    visibleMin: 2200,
    visibleMax: 3400,
    hiddenMin: 1100,
    hiddenMax: 1600,
    description: "Velocidade media e tempo variavel"
  },
  {
    id: "hard",
    label: "Hard",
    speed: 300,
    visibleMin: 1800,
    visibleMax: 3000,
    hiddenMin: 1300,
    hiddenMax: 1900,
    description: "Rapido, com menos tempo para ler o movimento"
  },
  {
    id: "extreme",
    label: "Extreme",
    speed: 390,
    visibleMin: 1500,
    visibleMax: 2600,
    hiddenMin: 1500,
    hiddenMax: 2200,
    description: "Muito rapido, angulos mais agressivos"
  }
];

export default function MotionPredictionGame() {
  const [gameState, setGameState] = useState("ready");
  const [difficulty, setDifficulty] = useState(motionDifficulties[1]);
  const [round, setRound] = useState(1);
  const [ballPosition, setBallPosition] = useState(centerBallPosition());
  const [stopPosition, setStopPosition] = useState(null);
  const [guessPosition, setGuessPosition] = useState(null);
  const [roundResult, setRoundResult] = useState(null);
  const [results, setResults] = useState([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const frameRef = useRef(null);
  const lastFrameRef = useRef(null);
  const hideAtRef = useRef(null);
  const stopAtRef = useRef(null);
  const hiddenPhaseStartedRef = useRef(false);
  const positionRef = useRef(centerBallPosition());
  const velocityRef = useRef({ x: 0, y: 0 });
  const totalStartRef = useRef(null);

  const totalScore = results.reduce((sum, result) => sum + result.score, 0);
  const averagePrecision = getAverage(results.map((result) => result.precision));
  const bestPrecision = results.reduce(
    (best, result) => Math.max(best, result.precision),
    0
  );
  const totalTime = useMemo(() => {
    if (results.length === 0) {
      return 0;
    }

    return results[results.length - 1].totalElapsed;
  }, [results]);

  useEffect(() => {
    return () => {
      cancelAnimation();
    };
  }, []);

  function startGame() {
    setResults([]);
    setStreak(0);
    setBestStreak(0);
    totalStartRef.current = performance.now();
    startRound(1, difficulty);
  }

  function startRound(nextRound, selectedDifficulty = difficulty) {
    const startPosition = createStartPosition();
    const velocity = createVelocity(selectedDifficulty, nextRound);

    cancelAnimation();
    positionRef.current = startPosition;
    velocityRef.current = velocity;
    const now = performance.now();
    const visibleDuration = randomBetween(
      selectedDifficulty.visibleMin,
      selectedDifficulty.visibleMax
    );
    const hiddenDuration = randomBetween(
      selectedDifficulty.hiddenMin,
      selectedDifficulty.hiddenMax
    );

    hideAtRef.current = now + visibleDuration;
    stopAtRef.current = hideAtRef.current + hiddenDuration;
    hiddenPhaseStartedRef.current = false;
    lastFrameRef.current = null;

    setRound(nextRound);
    setBallPosition(startPosition);
    setStopPosition(null);
    setGuessPosition(null);
    setRoundResult(null);
    setGameState("moving");

    frameRef.current = requestAnimationFrame(animateBall);
  }

  function animateBall(now) {
    if (lastFrameRef.current === null) {
      lastFrameRef.current = now;
    }

    const deltaSeconds = Math.min((now - lastFrameRef.current) / 1000, 0.04);
    lastFrameRef.current = now;

    const nextPosition = moveWithBounce(
      positionRef.current,
      velocityRef.current,
      deltaSeconds
    );

    positionRef.current = nextPosition;

    if (now >= stopAtRef.current) {
      const stopped = getBallCenter(nextPosition);

      cancelAnimation();
      setStopPosition(stopped);
      setBallPosition(null);
      setGameState("guessing");
      return;
    }

    if (now >= hideAtRef.current) {
      setBallPosition(null);
      if (!hiddenPhaseStartedRef.current) {
        hiddenPhaseStartedRef.current = true;
        setGameState("hidden");
      }
    } else {
      setBallPosition(nextPosition);
    }

    frameRef.current = requestAnimationFrame(animateBall);
  }

  function handleArenaClick(event) {
    if (gameState !== "guessing" || !stopPosition) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const scaleX = ARENA_WIDTH / rect.width;
    const scaleY = ARENA_HEIGHT / rect.height;
    const guess = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
    const distance = getDistance(guess, stopPosition);
    const precision = clamp(100 - distance / 5, 0, 100);
    const score = Math.round(precision);
    const totalElapsed = (performance.now() - totalStartRef.current) / 1000;
    const result = {
      round,
      guess,
      real: stopPosition,
      distance,
      precision,
      score,
      totalElapsed
    };

    setGuessPosition(guess);
    setRoundResult(result);
    setResults((current) => [...current, result]);
    setStreak((current) => {
      const nextStreak = precision >= HIT_STREAK_THRESHOLD ? current + 1 : 0;
      setBestStreak((currentBest) => Math.max(currentBest, nextStreak));
      return nextStreak;
    });
    setGameState("result");
  }

  function continueAfterResult() {
    if (round >= ROUND_LIMIT) {
      setGameState("gameover");
      return;
    }

    startRound(round + 1);
  }

  function resetGame() {
    cancelAnimation();
    setGameState("ready");
    setRound(1);
    setBallPosition(centerBallPosition());
    setStopPosition(null);
    setGuessPosition(null);
    setRoundResult(null);
    setResults([]);
    setStreak(0);
    setBestStreak(0);
    totalStartRef.current = null;
  }

  function changeDifficulty(nextDifficulty) {
    setDifficulty(nextDifficulty);
    resetGame();
  }

  function cancelAnimation() {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }

  const hudAverage = results.length > 0 ? `${Math.round(averagePrecision)}%` : "--";

  return (
    <div className="py-8">
      <section className="mx-auto flex max-w-5xl flex-col items-center text-white">
        <div className="mb-5 w-full max-w-[700px]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
                Motion Prediction
              </p>
              <h2 className="mt-1 text-2xl font-bold text-[#17211d]">
                Onde a bola parou?
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {motionDifficulties.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => changeDifficulty(item)}
                  disabled={gameState !== "ready"}
                  className={`h-10 rounded-md px-3 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-cyan-300/30 disabled:cursor-not-allowed disabled:opacity-60 ${
                    difficulty.id === item.id
                      ? "bg-[#101417] text-white"
                      : "border border-[#c9c0ae] bg-white/70 text-[#17211d] hover:border-cyan-600"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2 rounded-lg border border-white/10 bg-[#101417] p-2 text-center shadow-xl">
            <HudStat label="Rodada" value={`${round}/${ROUND_LIMIT}`} />
            <HudStat label="Score" value={totalScore} />
            <HudStat label="Streak" value={streak} />
            <HudStat label="Media" value={hudAverage} />
          </div>

          <div
            className={`mt-4 flex min-h-14 items-center justify-center rounded-lg border px-5 py-3 text-center font-bold text-white shadow-lg transition ${
              gameState === "hidden"
                ? "border-cyan-300/60 bg-cyan-600 shadow-cyan-500/25"
                : gameState === "guessing"
                  ? "border-rose-300/60 bg-rose-500 shadow-rose-500/30"
                  : "border-transparent bg-transparent shadow-none"
            }`}
          >
            {gameState === "hidden" && "A bola sumiu. Continue prevendo o movimento."}
            {gameState === "guessing" &&
              "A bola parou. Clique na arena onde voce acha que ela terminou."}
          </div>
        </div>

        <div className="relative w-full max-w-[700px]">
          <div
            onClick={handleArenaClick}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
              }
            }}
            role="button"
            tabIndex={0}
            className="relative h-[500px] w-full overflow-hidden rounded-lg border border-white/10 bg-[#070b10] text-left shadow-2xl outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/30"
            aria-label="Arena do jogo Motion Prediction"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_18%,rgba(34,211,238,0.13),transparent_26%),radial-gradient(circle_at_78%_82%,rgba(255,255,255,0.08),transparent_22%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px]" />

            {gameState === "ready" && (
              <ArenaOverlay
                title="A bola vai parar sem avisar"
              text={`Dificuldade: ${difficulty.label}. A bola some, continua se movendo invisivel e para sem revelar a posicao.`}
            />
          )}

            {ballPosition && gameState === "moving" && (
              <span
                className="absolute rounded-full bg-cyan-300 shadow-[0_0_30px_rgba(103,232,249,0.95)]"
                style={{
                  width: `${(BLUE_BALL_SIZE / ARENA_WIDTH) * 100}%`,
                  aspectRatio: "1 / 1",
                  left: `${(ballPosition.x / ARENA_WIDTH) * 100}%`,
                  top: `${(ballPosition.y / ARENA_HEIGHT) * 100}%`
                }}
              />
            )}

            {roundResult && (gameState === "result" || gameState === "gameover") && (
              <ResultMarkers result={roundResult} />
            )}

            {gameState === "gameover" && (
              <GameOverOverlay
                rounds={results.length}
                averagePrecision={averagePrecision}
                bestPrecision={bestPrecision}
                totalTime={totalTime}
                totalScore={totalScore}
                streak={bestStreak}
                onRestart={resetGame}
              />
            )}
          </div>
        </div>

        {gameState === "result" && roundResult && (
          <RoundResultPanel
            result={roundResult}
            isLastRound={round >= ROUND_LIMIT}
            onContinue={continueAfterResult}
          />
        )}

        {gameState === "ready" && (
          <div className="mt-5 flex w-full max-w-[700px] flex-wrap items-center justify-between gap-3 rounded-lg border border-[#d8d1c2] bg-white/75 p-4 text-[#17211d] shadow-sm">
            <p className="text-sm text-[#4c5a54]">{difficulty.description}</p>
            <button
              type="button"
              onClick={startGame}
              className="h-12 rounded-md bg-[#101417] px-6 font-bold text-white transition hover:bg-[#26343a] focus:outline-none focus:ring-4 focus:ring-cyan-200"
            >
              Iniciar
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function HudStat({ label, value }) {
  return (
    <div className="rounded-md bg-white/[0.08] px-2 py-2">
      <p className="text-xs text-white/54">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function ArenaOverlay({ title, text }) {
  return (
    <div className="absolute inset-0 z-10 grid place-items-center p-6 text-center">
      <div className="max-w-md rounded-lg border border-white/10 bg-black/35 p-5 backdrop-blur">
        <p className="text-2xl font-bold text-white">{title}</p>
        <p className="mt-3 leading-7 text-white/68">{text}</p>
      </div>
    </div>
  );
}

function ResultMarkers({ result }) {
  return (
    <>
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`0 0 ${ARENA_WIDTH} ${ARENA_HEIGHT}`}
        preserveAspectRatio="none"
      >
        <line
          x1={result.real.x}
          y1={result.real.y}
          x2={result.guess.x}
          y2={result.guess.y}
          stroke="rgba(251, 113, 133, 0.75)"
          strokeWidth="2"
        />
      </svg>
      <span
        className="absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-200 bg-cyan-200/30 shadow-[0_0_28px_rgba(103,232,249,0.85)]"
        style={{
          left: `${(result.real.x / ARENA_WIDTH) * 100}%`,
          top: `${(result.real.y / ARENA_HEIGHT) * 100}%`
        }}
      />
      <span
        className="absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-rose-300 bg-rose-300/25 shadow-[0_0_28px_rgba(251,113,133,0.8)]"
        style={{
          left: `${(result.guess.x / ARENA_WIDTH) * 100}%`,
          top: `${(result.guess.y / ARENA_HEIGHT) * 100}%`
        }}
      />
    </>
  );
}

function RoundResultPanel({ result, isLastRound, onContinue }) {
  return (
    <div className="mt-4 w-full max-w-[700px] rounded-lg border border-white/10 bg-[#101417] p-4 text-white shadow-xl">
      <div className="grid gap-3 sm:grid-cols-5">
        <ResultStat label="Distancia" value={`${result.distance.toFixed(0)}px`} />
        <ResultStat label="Precisao" value={`${Math.round(result.precision)}%`} />
        <ResultStat label="Pontuacao" value={`${result.score}/100`} />
        <ResultStat label="Real" value={formatPoint(result.real)} />
        <ResultStat label="Clique" value={formatPoint(result.guess)} />
      </div>
      <button
        type="button"
        onClick={onContinue}
        className="mt-4 h-11 w-full rounded-md bg-cyan-300 px-5 font-bold text-[#071014] transition hover:bg-cyan-200 focus:outline-none focus:ring-4 focus:ring-cyan-300/30 sm:w-auto"
      >
        {isLastRound ? "Ver resultado final" : "Proxima rodada"}
      </button>
    </div>
  );
}

function ResultStat({ label, value }) {
  return (
    <div>
      <p className="text-xs text-white/54">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}

function GameOverOverlay({
  rounds,
  averagePrecision,
  bestPrecision,
  totalTime,
  totalScore,
  streak,
  onRestart
}) {
  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-black/55 p-5 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg border border-white/10 bg-[#101417] p-5 text-white shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
          Fim de jogo
        </p>
        <h3 className="mt-2 text-3xl font-bold">Resumo da partida</h3>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <ResultStat label="Rodadas completas" value={rounds} />
          <ResultStat label="Precisao media" value={`${Math.round(averagePrecision)}%`} />
          <ResultStat label="Maior precisao" value={`${Math.round(bestPrecision)}%`} />
          <ResultStat label="Tempo total" value={formatTime(totalTime)} />
          <ResultStat label="Pontuacao total" value={totalScore} />
          <ResultStat label="Sequencia de acertos" value={streak} />
        </div>
        <button
          type="button"
          onClick={onRestart}
          className="mt-6 h-12 w-full rounded-md bg-cyan-300 px-5 font-bold text-[#071014] transition hover:bg-cyan-200 focus:outline-none focus:ring-4 focus:ring-cyan-300/30"
        >
          Jogar novamente
        </button>
      </div>
    </div>
  );
}

function moveWithBounce(position, velocity, deltaSeconds) {
  let nextX = position.x + velocity.x * deltaSeconds;
  let nextY = position.y + velocity.y * deltaSeconds;

  if (nextX <= 0) {
    nextX = 0;
    velocity.x *= -1;
  }

  if (nextX >= ARENA_WIDTH - BLUE_BALL_SIZE) {
    nextX = ARENA_WIDTH - BLUE_BALL_SIZE;
    velocity.x *= -1;
  }

  if (nextY <= 0) {
    nextY = 0;
    velocity.y *= -1;
  }

  if (nextY >= ARENA_HEIGHT - BLUE_BALL_SIZE) {
    nextY = ARENA_HEIGHT - BLUE_BALL_SIZE;
    velocity.y *= -1;
  }

  return { x: nextX, y: nextY };
}

function createStartPosition() {
  return {
    x: randomBetween(40, ARENA_WIDTH - BLUE_BALL_SIZE - 40),
    y: randomBetween(40, ARENA_HEIGHT - BLUE_BALL_SIZE - 40)
  };
}

function centerBallPosition() {
  return {
    x: ARENA_WIDTH / 2 - BLUE_BALL_SIZE / 2,
    y: ARENA_HEIGHT / 2 - BLUE_BALL_SIZE / 2
  };
}

function createVelocity(difficulty, round) {
  const angle = createAngle(difficulty.id, round);
  const speed = difficulty.speed + round * 5;

  return {
    x: Math.cos(angle) * speed,
    y: Math.sin(angle) * speed
  };
}

function createAngle(difficultyId, round) {
  if (difficultyId === "extreme") {
    const baseAngles = [24, 39, 52, 128, 141, 219, 233, 308, 326];
    return toRadians(
      baseAngles[Math.floor(Math.random() * baseAngles.length)] + round * 2
    );
  }

  return Math.random() * Math.PI * 2;
}

function getBallCenter(position) {
  return {
    x: clamp(position.x + BLUE_BALL_SIZE / 2, RED_BALL_SIZE / 2, ARENA_WIDTH - RED_BALL_SIZE / 2),
    y: clamp(position.y + BLUE_BALL_SIZE / 2, RED_BALL_SIZE / 2, ARENA_HEIGHT - RED_BALL_SIZE / 2)
  };
}

function getDistance(pointA, pointB) {
  return Math.sqrt((pointA.x - pointB.x) ** 2 + (pointA.y - pointB.y) ** 2);
}

function getAverage(values) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatPoint(point) {
  return `${Math.round(point.x)}, ${Math.round(point.y)}`;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}
