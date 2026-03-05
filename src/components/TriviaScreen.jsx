import { useState, useEffect, useCallback, useRef } from "react";
import { socket } from "../socket";
import { triviaQuestions } from "../questions";
import "./TriviaScreen.css";

export default function TriviaScreen({ player, myPlayerName }) {
  // 1. State Initialization
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [score, setScore] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  // 2. Logic to determine if it's my turn
  // Normalize strings to avoid mismatch due to spaces or case
  const normalize = (str) =>
    String(str || "")
      .trim()
      .toLowerCase();

  const pName = normalize(player?.name);
  const myName = normalize(myPlayerName);

  // Check equality to be safe against whitespace
  const isMyTurn = pName && myName && pName === myName;

  // 3. Shuffle questions lazily (only once)
  const [shuffledQuestions] = useState(() => {
    if (!triviaQuestions || triviaQuestions.length === 0) return [];
    const shuffled = [...triviaQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });

  // 4. Timer Logic
  const scoreRef = useRef(score);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // Use a ref to track if we have already emitted end_turn to avoid double emission
  const hasEndedTurnRef = useRef(false);
  const timeLeftRef = useRef(timeLeft);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  const handleStopTimer = useCallback(() => {
    if (!isMyTurn || hasEndedTurnRef.current) return;

    hasEndedTurnRef.current = true;
    setIsPaused(true);

    socket.emit("end_turn", {
      score: scoreRef.current,
      timeRemaining: timeLeftRef.current,
    });
  }, [isMyTurn]); // Removed timeLeft dependency to prevent recreation

  // Timer Effect - Robust Date.now() based
  useEffect(() => {
    // If it's not my turn or paused, don't run the timer
    if (!isMyTurn || isPaused) return;

    const startTime = Date.now();
    const initialTime = timeLeft; // Capture current timeLeft (usually 120 on start)

    // Set up the interval
    const intervalId = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      const newTime = initialTime - elapsedSeconds;

      if (newTime <= 0) {
        setTimeLeft(0);
        clearInterval(intervalId);
      } else {
        setTimeLeft(newTime);
      }
    }, 1000);

    // Cleanup on unmount or dependency change
    return () => {
      clearInterval(intervalId);
    };
  }, [isMyTurn, isPaused]); // Re-run only if turn/pause status changes

  // Check for timeout separately
  useEffect(() => {
    if (timeLeft === 0 && isMyTurn && !isPaused && !hasEndedTurnRef.current) {
      // Use setTimeout to avoid potential state update conflicts during render cycle
      const timeoutId = setTimeout(() => {
        handleStopTimer();
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [timeLeft, isMyTurn, isPaused, handleStopTimer]);

  // 5. Answer Logic
  const handleAnswerClick = (answer) => {
    if (!isMyTurn || selectedAnswer !== null) return;

    setSelectedAnswer(answer);
    const correct =
      answer === shuffledQuestions[currentQuestionIndex].correctAnswer;
    setIsAnswerCorrect(correct);

    if (correct) {
      setScore((prev) => prev + 1);
    }

    setTimeout(() => {
      setSelectedAnswer(null);
      setIsAnswerCorrect(null);
      setCurrentQuestionIndex((prev) => (prev + 1) % shuffledQuestions.length);
    }, 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // 6. Waiting Screen (if not my turn)
  if (!isMyTurn) {
    return (
      <div className="trivia-wrapper">
        <div className="trivia-container waiting-mode">
          <h2>Jugador {player?.name} está respondiendo...</h2>
          <div className="loader"></div>
          <p>Por favor espera tu turno.</p>
        </div>
      </div>
    );
  }

  // 7. Loading state if questions aren't ready
  if (shuffledQuestions.length === 0) return <div>Cargando preguntas...</div>;

  const currentQuestion = shuffledQuestions[currentQuestionIndex];

  // 8. Main Render
  return (
    <div className="trivia-wrapper" translate="no">
      <div className="trivia-container">
        <div className="trivia-header">
          <div className="timer-box">
            <span className="notranslate">Tiempo: {formatTime(timeLeft)}</span>
          </div>
          <div className="score-box">
            <span className="notranslate">Aciertos: {score}</span>
          </div>
        </div>

        <div className="question-box">
          <h2 className="notranslate">{currentQuestion.question}</h2>
        </div>

        <div className="answers-grid">
          {currentQuestion.answers.map((answer, index) => {
            let buttonClass = "answer-button notranslate";
            if (selectedAnswer === answer) {
              buttonClass += isAnswerCorrect ? " correct" : " incorrect";
            } else if (
              selectedAnswer !== null &&
              answer === currentQuestion.correctAnswer
            ) {
              // Optional: indicate correct answer
            }

            return (
              <button
                key={index}
                className={buttonClass}
                onClick={() => handleAnswerClick(answer)}
                disabled={selectedAnswer !== null}
              >
                {answer}
              </button>
            );
          })}
        </div>

        <button
          className="stop-timer-button notranslate"
          onClick={handleStopTimer}
        >
          Terminar turno
        </button>
      </div>
    </div>
  );
}
