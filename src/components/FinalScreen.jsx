import { socket } from "../socket";
import "./FinalScreen.css";

export default function FinalScreen({ players }) {
  const handleReset = () => {
    socket.emit("reset_game");
  };

  // Sort players by soldiers (optional, to show winner)
  const sortedPlayers = [...players].sort((a, b) => b.soldiers - a.soldiers);
  const winner = sortedPlayers[0];

  return (
    <div className="final-wrapper">
      <div className="final-container">
        <h1 className="final-title">Fin del Juego</h1>
        <h2 className="good-luck-message">¡Buena suerte a todos!</h2>

        <div className="instructions-box">
          <h3>Instrucciones Finales</h3>
          <p>
            Cuenten cuántos territorios tiene ocupados cada uno para determinar
            el ganador.
          </p>
        </div>

        <div className="leaderboard">
          <h3>Tabla de Posiciones</h3>
          <ul>
            {sortedPlayers.map((player, index) => (
              <li key={index} className="leaderboard-item">
                <span className="rank">{index + 1}</span>
                <span className="name">{player.name}</span>
                <span className="score">{player.soldiers} Soldados</span>
              </li>
            ))}
          </ul>
        </div>

        <button className="reset-button" onClick={handleReset}>
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
