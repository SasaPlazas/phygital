import { useState, useEffect, useRef } from "react";
import { socket } from "../socket";
import "./AttackScreen.css";
import avatars from "../avatars";

export default function AttackScreen({ player, myPlayerName, attackEndsAt }) {
  const [timeLeft, setTimeLeft] = useState(60); // 1 minute to attack/move
  const safeAvatarIndex = Number.isInteger(player?.avatarIndex)
    ? player.avatarIndex
    : 0;

  const isMyTurn =
    String(player?.name || "")
      .trim()
      .toLowerCase() ===
    String(myPlayerName || "")
      .trim()
      .toLowerCase();

  const hasEmittedRef = useRef(false);

  useEffect(() => {
    hasEmittedRef.current = false;
    if (attackEndsAt && Number.isFinite(attackEndsAt)) {
      const update = () => {
        const remaining = Math.max(
          0,
          Math.ceil((attackEndsAt - Date.now()) / 1000)
        );
        setTimeLeft(remaining);
      };
      const first = setTimeout(update, 0);
      const interval = setInterval(update, 250);
      return () => {
        clearTimeout(first);
        clearInterval(interval);
      };
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [attackEndsAt, player?.name]);

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
              src={avatars[safeAvatarIndex]}
              alt={player?.name ? `Avatar ${player.name}` : "Avatar"}
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
        <h3 className="attack-instruction">Posiciona tus Soldados.</h3>

        {isMyTurn && (
          <button className="finish-turn-button" onClick={handleFinishTurn}>
            Terminar Turno
          </button>
        )}
        {!isMyTurn && (
          <p className="waiting-message">
            Esperando a que {player?.name || "el jugador"} termine su turno...
          </p>
        )}
      </div>
    </div>
  );
}
