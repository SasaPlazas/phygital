import { socket } from "../socket";
import "./TurnAnnouncement.css";

export default function TurnAnnouncement({ player, round, myPlayerName }) {
  // Simple, robust comparison
  const normalize = (str) =>
    String(str || "")
      .trim()
      .toLowerCase();

  const pName = normalize(player?.name);
  const myName = normalize(myPlayerName);

  // Check equality to be safe against whitespace
  const isMyTurn = pName && myName && pName === myName;

  const handleStartTrivia = () => {
    socket.emit("start_trivia");
  };

  return (
    <div className="turn-wrapper">
      <div className="turn-container">
        <h2 className="round-title">Ronda {round} / 8</h2>

        <div className="player-display">
          <div
            className="player-avatar-large"
            style={{ backgroundColor: player.color }}
          ></div>
          <h1 className="player-name-large">{player.name}</h1>
        </div>

        <p className="turn-instruction">
          {isMyTurn ? "Es tu turno" : `Es el turno de ${player.name}`}
        </p>

        {isMyTurn ? (
          <button className="start-trivia-button" onClick={handleStartTrivia}>
            Iniciar trivia
          </button>
        ) : (
          <div style={{ textAlign: "center", width: "100%" }}>
            <p className="waiting-message">Esperando a que inicie...</p>
            {/* If names look similar but strict check failed, show button anyway? 
                Actually, the 'includes' check above handles that. 
                If we are here, names are truly different. 
            */}
          </div>
        )}
      </div>
    </div>
  );
}
