"use client";

import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import {
  Play,
  Pause,
  RotateCcw,
  Home as HomeIcon,
  Trophy,
  Timer,
  MousePointerClick,
  Sparkles,
  User,
  HeartHandshake,
  Sun,
  Moon,
  Volume2,
  VolumeX,
} from "lucide-react";

interface FruitItem {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

const FRUIT_LIST: Omit<FruitItem, "id">[] = [
  { name: "사과", emoji: "🍎", color: "text-rose-500" },
  { name: "바나나", emoji: "🍌", color: "text-amber-500" },
  { name: "포도", emoji: "🍇", color: "text-purple-500" },
  { name: "딸기", emoji: "🍓", color: "text-red-500" },
  { name: "수박", emoji: "🍉", color: "text-emerald-500" },
  { name: "오렌지", emoji: "🍊", color: "text-orange-500" },
  { name: "복숭아", emoji: "🍑", color: "text-pink-500" },
  { name: "체리", emoji: "🍒", color: "text-rose-600" },
];

interface CardState {
  id: number;
  fruit: (typeof FRUIT_LIST)[0];
  isFlipped: boolean;
  isMatched: boolean;
}

type GameStage = "entry" | "playing" | "cleared";

export default function CardGamePage() {
  const [userName, setUserName] = useState<string>("");
  const [stage, setStage] = useState<GameStage>("entry");
  const [cards, setCards] = useState<CardState[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(false);

  // 게임 통계
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 다크모드 동기화
  useEffect(() => {
    const isSavedDark = localStorage.getItem("theme") === "dark";
    if (isSavedDark) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return next;
    });
  };

  // 16장 덱 생성 (8종류 x 2)
  const generateDeck = (): CardState[] => {
    const deck: CardState[] = [];
    const duplicated = [...FRUIT_LIST, ...FRUIT_LIST];

    // Fisher-Yates shuffle
    for (let i = duplicated.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [duplicated[i], duplicated[j]] = [duplicated[j], duplicated[i]];
    }

    duplicated.forEach((fruit, idx) => {
      deck.push({
        id: idx,
        fruit,
        isFlipped: false,
        isMatched: false,
      });
    });

    return deck;
  };

  // 타이머
  useEffect(() => {
    if (stage === "playing" && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage, isPaused]);

  // 게임 시작
  const handleStartGame = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userName.trim()) return;

    setCards(generateDeck());
    setSelectedCards([]);
    setIsProcessing(false);
    setIsPaused(false);
    setElapsedTime(0);
    setMoves(0);
    setMatchedPairs(0);
    setStage("playing");
  };

  // 다시 시작
  const handleRestart = () => {
    setCards(generateDeck());
    setSelectedCards([]);
    setIsProcessing(false);
    setIsPaused(false);
    setElapsedTime(0);
    setMoves(0);
    setMatchedPairs(0);
    setStage("playing");
  };

  // 일시정지 토글
  const handleTogglePause = () => {
    setIsPaused((prev) => !prev);
  };

  // 처음으로
  const handleGoHome = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStage("entry");
    setCards([]);
    setSelectedCards([]);
    setElapsedTime(0);
    setMoves(0);
    setMatchedPairs(0);
    setIsPaused(false);
  };

  // 카드 클릭
  const handleCardClick = (cardIndex: number) => {
    if (isPaused || isProcessing) return;

    const clickedCard = cards[cardIndex];
    if (clickedCard.isFlipped || clickedCard.isMatched) return;

    const newCards = [...cards];
    newCards[cardIndex].isFlipped = true;
    setCards(newCards);

    const newSelected = [...selectedCards, cardIndex];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setIsProcessing(true);
      setMoves((prev) => prev + 1);

      const [firstIdx, secondIdx] = newSelected;
      const firstCard = cards[firstIdx];
      const secondCard = cards[secondIdx];

      if (firstCard.fruit.name === secondCard.fruit.name) {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, idx) =>
              idx === firstIdx || idx === secondIdx
                ? { ...c, isMatched: true }
                : c
            )
          );
          setSelectedCards([]);
          setIsProcessing(false);
          setMatchedPairs((prev) => {
            const nextVal = prev + 1;
            if (nextVal === 8) {
              handleGameClear();
            }
            return nextVal;
          });
        }, 450);
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, idx) =>
              idx === firstIdx || idx === secondIdx
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setSelectedCards([]);
          setIsProcessing(false);
        }, 850);
      }
    }
  };

  interface RankItem {
    rank: number;
    name: string;
    finishtime: string;
    score: number;
    timestamp?: string;
  }

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [top3List, setTop3List] = useState<RankItem[]>([]);
  const [isLoadingRank, setIsLoadingRank] = useState<boolean>(false);

  // Google Apps Script 웹 앱 URL
  const GOOGLE_SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || "";

  // TOP 3 순위 가져오기 함수
  const fetchTop3Rankings = async () => {
    if (!GOOGLE_SCRIPT_URL) return;
    setIsLoadingRank(true);
    try {
      const res = await fetch(GOOGLE_SCRIPT_URL);
      const json = await res.json();
      if (json && Array.isArray(json.top3)) {
        setTop3List(json.top3);
      }
    } catch (err) {
      console.error("TOP 3 랭킹 조회 실패:", err);
    } finally {
      setIsLoadingRank(false);
    }
  };

  // 클리어 시 구글 시트 저장 함수
  const saveGameResultToSheet = async (finalTimeSeconds: number, totalMoves: number) => {
    const calculatedScore = totalMoves > 0 ? Math.max(10, Math.round((8 / totalMoves) * 100)) : 100;
    const finishtime = formatTime(finalTimeSeconds);

    if (!GOOGLE_SCRIPT_URL) {
      // 로컬 테스트용 폴백 랭킹 표시
      setTop3List([
        { rank: 1, name: userName, finishtime: finishtime, score: calculatedScore },
      ]);
      return;
    }

    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timestamp,
          name: userName,
          score: calculatedScore,
          finishtime,
        }),
      });

      setSaveStatus("success");

      // 저장 완료 후 최신 TOP 3 데이터 즉시 조회
      setTimeout(() => {
        fetchTop3Rankings();
      }, 700);
    } catch (err) {
      console.error("구글 시트 저장 실패:", err);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  // 클리어
  const handleGameClear = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStage("cleared");

    // 게임을 끝까지 완료한 경우에만 구글 시트에 데이터 저장 실행
    saveGameResultToSheet(elapsedTime, moves);

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 250);
    } catch {
      // ignore
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}.${secs.toString().padStart(2, "0")}`;
  };

  // 클리어 화면용: 소수점이나 분/초 복잡한 형식 없이 '00초' 형태로 통일
  const formatSecondsOnly = (val: string | number) => {
    if (!val && val !== 0) return "0초";
    const str = String(val).trim();

    // 1. 순수 숫자(초 단위)인 경우
    if (/^\d+$/.test(str)) {
      return `${parseInt(str, 10)}초`;
    }

    // 2. "mm.ss" 또는 "mm:ss" 형식인 경우 -> 총 초(seconds)로 변환
    if (/^\d{1,2}[\.:]\d{1,2}$/.test(str)) {
      const parts = str.split(/[\.:]/);
      const m = parseInt(parts[0], 10) || 0;
      const s = parseInt(parts[1], 10) || 0;
      return `${m * 60 + s}초`;
    }

    // 3. 구글 시트 Date 객체 문자열 ("Sat Dec 30 1899 00:26:00 GMT..." 등)인 경우
    const dateParsed = new Date(str);
    if (!isNaN(dateParsed.getTime())) {
      const m = dateParsed.getMinutes();
      const s = dateParsed.getSeconds();
      return `${m * 60 + s}초`;
    }

    // 4. "00초" 이미 붙어있는 경우
    if (str.endsWith("초")) return str;

    const parsedNum = parseFloat(str);
    if (!isNaN(parsedNum)) {
      return `${Math.round(parsedNum)}초`;
    }

    return `${str}초`;
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between transition-colors duration-500 ${
        isDark
          ? "bg-gradient-to-br from-[#121319] via-[#1a1b26] to-[#141724] text-zinc-100"
          : "bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] text-zinc-800"
      }`}
    >
      {/* 상단 네비게이션 / 헤더 */}
      <header className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl glass-panel flex items-center justify-center text-xl shadow-sm">
            🧩
          </div>
          <span className="font-extrabold text-lg sm:text-xl tracking-tight text-black dark:text-white">
            카드 맞추기 게임
          </span>
        </div>

        {/* 테마 토글 버튼 */}
        <button
          onClick={toggleTheme}
          aria-label="라이트/다크 모드 전환"
          className="p-2.5 rounded-2xl glass-panel hover:scale-105 active:scale-95 transition cursor-pointer text-zinc-600 dark:text-zinc-300"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-500" />
          )}
        </button>
      </header>

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 w-full max-w-2xl mx-auto">
        {/* 1. 시작 화면 */}
        {stage === "entry" && (
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 sm:p-9 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-300">
            {/* 타이틀 및 아이콘 */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl mx-auto flex items-center justify-center text-4xl sm:text-5xl shadow-lg mb-6 glass-card-back">
              🍓
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 text-black dark:text-white">
              카드 맞추기 게임
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-200 mb-8 font-medium">
              카드를 뒤집어 동일한 8쌍의 과일을 찾아보세요!
            </p>

            <form onSubmit={handleStartGame} className="space-y-5">
              <div className="text-left">
                <label
                  htmlFor="player-name"
                  className="block text-xs font-bold text-zinc-700 dark:text-zinc-200 mb-1.5 uppercase tracking-wider"
                >
                  플레이어 이름
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-zinc-500 dark:text-zinc-400">
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  </span>
                  <input
                    id="player-name"
                    type="text"
                    required
                    placeholder="이름을 입력하세요"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 sm:py-3.5 !bg-white shadow-sm dark:!bg-[#151722] border-2 border-zinc-300 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold text-sm sm:text-base text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 transition"
                    maxLength={15}
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!userName.trim()}
                className="w-full py-3.5 sm:py-4 px-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 transition transform active:scale-98 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                게임 시작
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-zinc-200/60 dark:border-zinc-800/80 flex items-center justify-center gap-3 text-xs font-medium text-zinc-500 dark:text-zinc-300">
              <span>4 × 4 격자</span>
              <span>•</span>
              <span>8종 과일</span>
              <span>•</span>
              <span>시간 기록 측정</span>
            </div>
          </div>
        )}

        {/* 2. 게임 플레이 화면 */}
        {stage === "playing" && (
          <div className="w-full flex flex-col items-center">
            {/* 상단 상태 바 */}
            <div className="w-full glass-panel rounded-2xl p-3.5 sm:p-4 mb-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base sm:text-lg">
                  {userName.charAt(0)}
                </div>
                <div>
                  <div className="text-[11px] text-zinc-400 font-medium">
                    플레이어
                  </div>
                  <div className="text-xs sm:text-sm font-bold truncate max-w-[100px] sm:max-w-[140px] text-zinc-800 dark:text-zinc-200">
                    {userName}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-black/5 dark:bg-white/5 rounded-xl">
                  <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 animate-pulse" />
                  <span className="font-mono font-bold">
                    {formatTime(elapsedTime)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-black/5 dark:bg-white/5 rounded-xl">
                  <MousePointerClick className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500" />
                  <span className="font-mono font-bold">{moves}회</span>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-500/10 dark:bg-emerald-400/15 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="font-mono font-bold">{matchedPairs} / 8</span>
                </div>
              </div>
            </div>

            {/* 조작 버튼 바 */}
            <div className="w-full flex items-center justify-between mb-3.5 gap-2">
              <button
                onClick={handleGoHome}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-panel text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm"
              >
                <HomeIcon className="w-3.5 h-3.5" />
                처음으로
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTogglePause}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer ${
                    isPaused
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                      : "bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/20"
                  }`}
                >
                  {isPaused ? (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      계속하기
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      일시정지
                    </>
                  )}
                </button>

                <button
                  onClick={handleRestart}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-panel text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  다시 시작
                </button>
              </div>
            </div>

            {/* 4x4 반투명 유리 카드 그리드 */}
            <div className="relative w-full aspect-square max-w-[480px] glass-panel p-3 sm:p-4 rounded-3xl shadow-2xl">
              {/* 일시정지 오버레이 */}
              {isPaused && (
                <div className="absolute inset-0 z-20 bg-zinc-900/60 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center text-white animate-in fade-in duration-200">
                  <Pause className="w-12 h-12 mb-3 text-indigo-400 animate-bounce" />
                  <h3 className="text-xl sm:text-2xl font-black mb-1">
                    게임 일시정지
                  </h3>
                  <p className="text-xs text-zinc-300 mb-5">
                    잠시 멈춤 상태입니다.
                  </p>
                  <button
                    onClick={handleTogglePause}
                    className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg transition active:scale-95 text-xs sm:text-sm cursor-pointer"
                  >
                    계속 플레이하기
                  </button>
                </div>
              )}

              <div className="grid grid-cols-4 grid-rows-4 gap-2 sm:gap-3 w-full h-full">
                {cards.map((card, idx) => {
                  const isRevealed = card.isFlipped || card.isMatched;

                  return (
                    <button
                      key={card.id}
                      onClick={() => handleCardClick(idx)}
                      disabled={isRevealed || isPaused || isProcessing}
                      aria-label={`카드 ${idx + 1}`}
                      className={`relative w-full h-full rounded-2xl select-none transition-all duration-300 transform active:scale-95 cursor-pointer flex flex-col items-center justify-center ${
                        card.isMatched
                          ? "glass-card-front !border-2 !border-emerald-500 bg-emerald-500/15 opacity-80 scale-[0.98] shadow-sm"
                          : isRevealed
                          ? "glass-card-front !border-2 !border-indigo-500 dark:!border-indigo-400 scale-[1.03] shadow-md"
                          : "glass-card-back hover:scale-[1.04] hover:shadow-lg hover:!border-indigo-400/80"
                      }`}
                    >
                      {isRevealed ? (
                        <div className="flex flex-col items-center justify-center animate-in zoom-in-75 duration-200">
                          <span className="text-2xl sm:text-4xl filter drop-shadow-sm select-none">
                            {card.fruit.emoji}
                          </span>
                          <span className="text-[10px] sm:text-xs font-bold text-zinc-700 dark:text-zinc-200 mt-0.5 sm:mt-1">
                            {card.fruit.name}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center text-zinc-400/80 dark:text-zinc-500">
                          <span className="text-base sm:text-xl font-bold">
                            ?
                          </span>
                        </div>
                      )}

                      {card.isMatched && (
                        <span className="absolute top-1 sm:top-1.5 right-1.5 text-[10px] sm:text-xs font-bold text-emerald-500">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 3. 게임 완료 화면 */}
        {stage === "cleared" && (
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 sm:p-9 shadow-2xl text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-lg mb-5 bg-gradient-to-tr from-amber-400 to-orange-400 text-white animate-bounce">
              <Trophy className="w-10 h-10 fill-current" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-black dark:text-white mb-1">
              축하합니다, {userName}님! 🎉
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-200 mb-6">
              모든 과일 카드의 짝을 맞추셨습니다!
            </p>

            {/* 통계 박스 */}
            <div className="bg-black/5 dark:bg-white/10 rounded-2xl p-4 sm:p-5 border border-zinc-200/50 dark:border-zinc-700/60 mb-6 space-y-3">
              <div className="flex justify-between items-center text-xs sm:text-sm font-semibold">
                <span className="text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                  <Timer className="w-4 h-4 text-indigo-500" />
                  완료까지 걸린 시간
                </span>
                <span className="text-lg sm:text-xl font-mono font-black text-indigo-600 dark:text-indigo-400">
                  {formatSecondsOnly(elapsedTime)}
                </span>
              </div>

              <div className="h-px bg-zinc-200/50 dark:bg-zinc-700/60" />

              <div className="flex justify-between items-center text-xs sm:text-sm font-semibold">
                <span className="text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                  <MousePointerClick className="w-4 h-4 text-purple-500" />
                  시도 횟수
                </span>
                <span className="text-sm sm:text-base font-black text-black dark:text-white">
                  {moves}회
                </span>
              </div>

              <div className="h-px bg-zinc-200/50 dark:bg-zinc-700/60" />

              <div className="flex justify-between items-center text-xs sm:text-sm font-semibold">
                <span className="text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-emerald-500" />
                  매칭 정확도
                </span>
                <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                  {moves > 0 ? Math.round((8 / moves) * 100) : 100}%
                </span>
              </div>
            </div>

            {/* 구글 시트 저장 상태 표시 */}
            {GOOGLE_SCRIPT_URL ? (
              <div className="mb-4 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition">
                {isSaving ? (
                  <span className="text-indigo-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                    구글 시트에 기록 저장 중...
                  </span>
                ) : saveStatus === "success" ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    ✓ 구글 스프레드시트에 저장 완료
                  </span>
                ) : saveStatus === "error" ? (
                  <span className="text-rose-500 flex items-center gap-1">
                    ✕ 구글 시트 저장 실패 (URL 확인 필요)
                  </span>
                ) : null}
              </div>
            ) : (
              <div className="mb-4 text-[11px] text-zinc-400 dark:text-zinc-500">
                ℹ️ .env.local의 NEXT_PUBLIC_GOOGLE_SCRIPT_URL 설정 시 결과가 자동 저장됩니다.
              </div>
            )}

            {/* 🏆 TOP 3 명예의 전당 */}
            <div className="w-full bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-zinc-200/50 dark:border-zinc-700/60 mb-6 text-left">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  명예의 전당 (완료까지 걸린 시간 TOP 3)
                </span>
                {isLoadingRank && (
                  <span className="text-[10px] text-zinc-400 animate-pulse">
                    갱신 중...
                  </span>
                )}
              </div>

              {top3List.length > 0 ? (
                <div className="space-y-2">
                  {top3List.map((item, idx) => {
                    const medalColors = [
                      "from-amber-400 to-yellow-500 text-white shadow-amber-500/30",
                      "from-slate-300 to-zinc-400 text-white shadow-zinc-400/30",
                      "from-amber-600 to-amber-700 text-white shadow-amber-700/30",
                    ];

                    const medalLabels = ["🥇 1등", "🥈 2등", "🥉 3등"];

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-zinc-200/70 dark:border-zinc-700/70 shadow-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center bg-gradient-to-tr shadow-sm ${
                              medalColors[idx] || "bg-zinc-200 text-zinc-700"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate max-w-[110px] sm:max-w-[140px]">
                              {item.name}
                            </div>
                            <div className="text-[10px] text-zinc-600 dark:text-zinc-300 font-medium">
                              정확도 {item.score}%
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                            완료까지 걸린 시간
                          </div>
                          <div className="font-mono text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                            ⏱ {formatSecondsOnly(item.finishtime)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                  {isLoadingRank ? "순위 집계 중입니다..." : "아직 기록된 랭킹 데이터가 없습니다."}
                </div>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleRestart}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 transition transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                한 번 더 플레이
              </button>

              <button
                onClick={handleGoHome}
                className="w-full py-3 px-6 glass-panel text-zinc-700 dark:text-zinc-200 font-bold rounded-2xl transition transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm hover:bg-black/5 dark:hover:bg-white/5"
              >
                <HomeIcon className="w-4 h-4" />
                처음으로 (이름 변경)
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 하단 카피라이트 푸터 */}
      <footer className="w-full py-4 px-4 text-center">
        <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-300 font-bold tracking-wide">
          Copyright INU 카드 맞추기 게임 by HSH
        </p>
      </footer>
    </div>
  );
}
