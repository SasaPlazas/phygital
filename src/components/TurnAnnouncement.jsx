import { useEffect } from "react";
import { socket } from "../socket";
import { useNavigate } from "react-router-dom";
import "./TurnAnnouncement.css";
import avatars from "../avatars";

export default function TurnAnnouncement({ player, round, totalRounds, myPlayerName }) {
  const navigate = useNavigate();

  useEffect(() => {
    // If player or totalRounds is missing/invalid, redirect to home
    // This happens if user refreshes the page or server restarts
    if (!player || !totalRounds) {
      navigate("/");
      return;
    }

    // Check if it's my turn
    const normalize = (str) =>
      String(str || "")
        .trim()
        .toLowerCase();
    const pName = normalize(player?.name);
    const myName = normalize(myPlayerName);

    if (pName && myName && pName === myName) {
      // If it's my turn, automatically proceed to trivia after a short delay
      // Or we can require a click. The prompt implies "Announcement" -> "Trivia"
      // Let's add a button for the player to start their turn, or auto-start.
      // Usually, announcement screens have a "Start Turn" button for the active player.
    }
  }, [player, myPlayerName, totalRounds, navigate]);

  const handleStartTurn = () => {
    socket.emit("start_trivia");
  };

  const isMyTurn =
    String(player?.name || "")
      .trim()
      .toLowerCase() ===
    String(myPlayerName || "")
      .trim()
      .toLowerCase();

  return (
    <div className="announcement-wrapper">
      <div className="announcement-container">
        <h1 className="round-title">
          Ronda {round} / {totalRounds}
        </h1>

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

        <p className="turn-message">
          {isMyTurn ? "¡Es tu turno!" : `Turno de ${player?.name}`}
        </p>

        {isMyTurn && (
          <button className="start-turn-button" onClick={handleStartTurn}>
            Comenzar Trivia
          </button>
        )}
        {!isMyTurn && <p className="waiting-message">Esperando que el jugador comience...</p>}
      </div>
    </div>
  );
}
