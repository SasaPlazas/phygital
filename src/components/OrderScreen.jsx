import "./OrderScreen.css";
import { socket } from "../socket";

export default function OrderScreen({ players, totalRounds }) {
  const handleStartRounds = () => {
    socket.emit("start_rounds");
  };

  return (
    <div className="order-wrapper">
      <div className="order-container">
        <h1>NOMBRE DEL JUEGO</h1>

        <div className="players-grid-container">
          <h2 className="section-title">Jugadores</h2>
          <div className="players-grid">
            {players.map((player, index) => (
              <div key={index} className="player-card">
                <span className="player-number">{index + 1}</span>
                <div
                  className="player-avatar"
                  style={{ backgroundColor: player.color }}
                ></div>
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
            <p>• 2 minutos para trivia</p>
            <p>• 1 acierto = 1 soldado</p>
            <p>• Movimientos = tiempo restante / 5 segundos</p>
          </div>
        </div>

        <button className="start-rounds-button" onClick={handleStartRounds}>
          Iniciar rondas
        </button>
      </div>
    </div>
  );
}
