import "./OrderScreen.css";
import { socket } from "../socket";
import avatars from "../avatars";
import logo from "../assets/HexArena.png";

export default function OrderScreen({ players, totalRounds }) {
  const handleStartRounds = () => {
    socket.emit("start_rounds");
  };

  return (
    <div className="order-wrapper">
      <div className="order-container">
        <img className="order-logo" src={logo} alt="HexArena" />

        <div className="players-grid-container">
          <div className="players-grid">
            {players.map((player, index) => (
              <div key={index} className="player-card">
                <span className="player-number">{index + 1}</span>
                <img
                  src={avatars[player.avatarIndex]}
                  alt={`Avatar ${player.name}`}
                  className="player-avatar-img"
                />
                <span className="player-name">{player.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="game-info-box">
          <p className="info-text">Explicación de como funciona la trivia</p>
          <div className="rules-list">
            <p>
              • {players.length} Jugadores → {totalRounds} Rondas
            </p>
            <p>• 1 minuto para trivia</p>
            <p>• 1 acierto = 1 soldado</p>
            <p>• Movimientos = tiempo restante / 5 segundos</p>
          </div>
        </div>

        <div className="buttons-container">
          <button className="start-rounds-button" onClick={handleStartRounds}>
            Iniciar rondas
          </button>
          <button
            className="order-reset-button"
            onClick={() => socket.emit("game_reset")}
          >
            Reiniciar Partida
          </button>
        </div>
      </div>
    </div>
  );
}
