import { useState, useEffect, useCallback, useRef } from "react";
import { socket } from "../socket";
import "./TriviaScreen.css";

export default function TriviaScreen({ player, myPlayerName, questions = [] }) {
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

  // 4. Timer Logic
  const scoreRef = useRef(score);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const timeLeftRef = useRef(timeLeft);
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // Use a ref to track if we have already emitted end_turn to avoid double emission
  const hasEndedTurnRef = useRef(false);

  const handleStopTimer = useCallback(() => {
    if (!isMyTurn || hasEndedTurnRef.current) return;

    hasEndedTurnRef.current = true;
    setIsPaused(true);

    socket.emit("end_turn", {
      correctAnswers: scoreRef.current,
      timeLeft: timeLeftRef.current,
    });
  }, [isMyTurn]); // Stable callback

  // Timer Effect - Robust Date.now() based
  useEffect(() => {
    // If it's not my turn or paused, don't run the timer
    // Also wait for questions to be loaded
    if (!isMyTurn || isPaused || !questions || questions.length === 0) return;

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isMyTurn, isPaused, questions]);

  // Check for timeout separately
  useEffect(() => {
    // Only check if time is 0 and we haven't already stopped
    if (timeLeft === 0 && isMyTurn && !isPaused && !hasEndedTurnRef.current) {
      // Use a timeout to push this to the end of the event loop
      // This avoids "update during render" issues if this effect runs synchronously with a state update
      const timeoutId = setTimeout(() => {
        handleStopTimer();
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [timeLeft, isMyTurn, isPaused, handleStopTimer]);

  // 5. Answer Logic
  // Track timeout to clear on unmount
  const answerTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (answerTimeoutRef.current) {
        clearTimeout(answerTimeoutRef.current);
      }
    };
  }, []);

  const handleAnswerClick = (answer) => {
    // Prevent answering if not my turn, already selected, or game is paused (timer stopped)
    if (!isMyTurn || selectedAnswer !== null || isPaused) return;

    setSelectedAnswer(answer);

    // Safety check
    if (!questions || questions.length === 0) return;

    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;

    const correct = answer === currentQ.correctAnswer;

    setIsAnswerCorrect(correct);

    if (correct) {
      setScore((prev) => prev + 1);
    }

    answerTimeoutRef.current = setTimeout(() => {
      // Check if component is still mounted implicitly by state update working (React handles this gracefully now usually, but let's be safe)
      // Actually, if unmounted, we shouldn't update state.
      // But we can't easily check "isMounted" without another ref.
      // Let's rely on clearing the timeout on unmount.

      setSelectedAnswer(null);
      setIsAnswerCorrect(null);

      // Check if we reached the end of questions
      if (currentQuestionIndex >= questions.length - 1) {
        handleStopTimer();
      } else {
        setCurrentQuestionIndex((prev) => prev + 1);
      }
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
  if (!questions || questions.length === 0)
    return <div>Cargando preguntas...</div>;

  const currentQuestion = questions[currentQuestionIndex];

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
            // Highlight selected answer
            if (selectedAnswer === answer) {
              buttonClass += isAnswerCorrect ? " correct" : " incorrect";
            }
            // Highlight correct answer if wrong one was selected
            if (
              selectedAnswer !== null &&
              answer === currentQuestion.correctAnswer &&
              selectedAnswer !== answer
            ) {
              buttonClass += " correct";
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
          disabled={selectedAnswer !== null}
        >
          Terminar turno
        </button>
      </div>
    </div>
  );
}
