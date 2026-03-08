import { useState, useEffect, useRef } from "react";
import { socket } from "../socket";
import "./AttackScreen.css";
import avatars from "../avatars";

export default function AttackScreen({ player, myPlayerName }) {
  const [timeLeft, setTimeLeft] = useState(60); // 1 minute to attack/move

  const isMyTurn =
    String(player?.name || "")
      .trim()
      .toLowerCase() ===
    String(myPlayerName || "")
      .trim()
      .toLowerCase();

  const hasEmittedRef = useRef(false);

  useEffect(() => {
    if (!isMyTurn) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!hasEmittedRef.current) {
            hasEmittedRef.current = true;
            setTimeout(() => {
              socket.emit("next_turn_request");
            }, 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isMyTurn]);

  const handleFinishTurn = () => {
    if (hasEmittedRef.current) return;
    hasEmittedRef.current = true;
    socket.emit("next_turn_request");
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="attack-wrapper">
      <div className="attack-container">
        <h1 className="attack-title">Fase de Ataque y Movimiento</h1>

        <div className="player-highlight">
          <div className="avatar-wrapper">
            <img
              src={avatars[player?.avatarIndex]}
              alt={`Avatar ${player?.name}`}
              className="avatar-image"
            />
          </div>
          <h2 className="player-name-large">{player?.name}</h2>
        </div>

        <div className="timer-display">
          <span className="time-value">{formatTime(timeLeft)}</span>
          <span className="time-label">Tiempo Restante</span>
        </div>

        <p className="instruction-text">¡Muévete y Ataca!</p>
        <h3 className="attack-instruction">
          Posiciona tus Soldados.
        </h3>

        {isMyTurn && (
          <button className="finish-turn-button" onClick={handleFinishTurn}>
            Terminar Turno
          </button>
        )}
        {!isMyTurn && (
          <p className="waiting-message">
            Esperando a que {player?.name} termine su turno...
          </p>
        )}
      </div>
    </div>
  );
}
