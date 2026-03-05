import { socket } from "../socket";
import SoldierToken from "./SoldierToken";
import "./RecapScreen.css";

export default function RecapScreen({ turnStats, player, myPlayerName }) {
  const { soldiers, movements } = turnStats;
  const isMyTurn = myPlayerName === player.name;

  const handleNextTurn = () => {
    if (isMyTurn) {
      socket.emit("next_turn_request");
    }
  };

  return (
    <div className="recap-wrapper">
      <div className="recap-container">
        <h2 className="recap-title">Resultados del Turno</h2>

        <div className="player-header">
          <div
            className="player-avatar-small"
            style={{ backgroundColor: player.color }}
          ></div>
          <span className="player-name-small">{player.name}</span>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{soldiers}</span>
            <span className="stat-label">Soldados</span>
            <div className="soldiers-container">
              {Array.from({ length: soldiers }).map((_, i) => (
                <SoldierToken key={i} color={player.color} size="small" />
              ))}
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-value">{movements}</span>
            <span className="stat-label">Movimientos</span>
            <div className="stat-icon movements-icon"></div>
          </div>
        </div>

        {isMyTurn ? (
          <button className="next-turn-button" onClick={handleNextTurn}>
            Siguiente
          </button>
        ) : (
          <p className="waiting-message">
            Esperando a que {player.name} termine...
          </p>
        )}
      </div>
    </div>
  );
}
