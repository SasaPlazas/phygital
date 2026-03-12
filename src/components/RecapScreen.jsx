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

  const safeAvatarIndex = Number.isInteger(player?.avatarIndex)
    ? player.avatarIndex
    : 0;

  return (
    <div className="recap-wrapper">
      <div className="recap-container">
        <h1 className="recap-title">Resultados del Turno</h1>

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

        <p className="waiting-message">
          {isMyTurn
            ? "Iniciando fase de ataque..."
            : "Iniciando fase de ataque..."}
        </p>
      </div>
    </div>
  );
}
