import { useState } from "react";
import { socket } from "../socket";
import "./RecapScreen.css";
import avatars from "../avatars";

export default function RecapScreen({ turnStats, player, myPlayerName }) {
  const isMyTurn =
    String(player?.name || "")
      .trim()
      .toLowerCase() ===
    String(myPlayerName || "")
      .trim()
      .toLowerCase();

  const [isNavigating, setIsNavigating] = useState(false);

  const handleNextPhase = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    socket.emit("start_attack_phase");
  };

  return (
    <div className="recap-wrapper">
      <div className="recap-container">
        <h1 className="recap-title">Resultados del Turno</h1>

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

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{turnStats?.soldiers || 0}</span>
            <span className="stat-label">Soldados</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{turnStats?.movements || 0}</span>
            <span className="stat-label">Movimientos</span>
          </div>
        </div>

        {isMyTurn && (
          <button
            className="next-turn-button"
            onClick={handleNextPhase}
            disabled={isNavigating}
          >
            {isNavigating ? "Cargando..." : "Ir a Fase de Ataque"}
          </button>
        )}
        {!isMyTurn && (
          <p className="waiting-message">Esperando al siguiente turno...</p>
        )}
      </div>
    </div>
  );
}
