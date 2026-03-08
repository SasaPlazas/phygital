import "./OrderScreen.css";
import { socket } from "../socket";
import avatars from "../avatars";

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

        <div className="buttons-container" style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px' }}>
          <button className="reset-button" onClick={() => socket.emit("game_reset")} style={{ backgroundColor: 'transparent', color: '#6b7280', border: '1px solid #d1d5db' }}>
            Reiniciar Partida
          </button>
          <button className="start-rounds-button" onClick={handleStartRounds}>
            Iniciar rondas
          </button>
        </div>
      </div>
    </div>
  );
}
