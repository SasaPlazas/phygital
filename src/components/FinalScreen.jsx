import { socket } from "../socket";
import "./FinalScreen.css";

export default function FinalScreen() {
  const handleReset = () => {
    socket.emit("game_reset");
  };

  // Sort players by soldiers (optional, to show winner)

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


        <button className="reset-button" onClick={handleReset}>
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
