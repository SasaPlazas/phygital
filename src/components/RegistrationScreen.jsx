import { useState, useEffect } from "react";
import { socket } from "../socket";
import "./RegistrationScreen.css";

export default function RegistrationScreen({ setMyPlayerName, myPlayerName }) {
  const [players, setPlayers] = useState([]);
  const [playerName, setPlayerName] = useState("");
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    // Listen for connection events
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onUpdatePlayers(updatedPlayers) {
      console.log("Players updated:", updatedPlayers);
      setPlayers(updatedPlayers);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("update_players", onUpdatePlayers);

    // Request players (safe to emit even if disconnected, socket.io buffers it)
    socket.emit("request_players");

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("update_players", onUpdatePlayers);
    };
  }, []);

  const handleAddPlayer = () => {
    if (playerName.trim() === "") return;
    if (players.includes(playerName.trim())) {
      alert("Este jugador ya está en la lista");
      return;
    }

    socket.emit("add_player", playerName.trim());
    setMyPlayerName(playerName.trim()); // Set local identity
    setPlayerName("");
  };

  const handleStart = () => {
    socket.emit("start_game");
    console.log("Starting game request sent");
  };

  const handleRemovePlayer = (indexToRemove) => {
    socket.emit("remove_player", indexToRemove);
  };

  return (
    <div className="registration-wrapper">
      <div className="registration-container">
        <h1>Registro de Jugadores</h1>
        <p className="subtitle">
          {isConnected ? "Conectado en tiempo real" : "Conectando..."}
        </p>

        <div className="input-group">
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Nombre del jugador"
            onKeyDown={(e) => e.key === "Enter" && handleAddPlayer()}
            autoFocus
          />
          <button
            onClick={handleAddPlayer}
            className="add-button"
            title="Añadir jugador"
          >
            +
          </button>
        </div>

        <div className="players-list-container">
          <h3>Jugadores ({players.length})</h3>
          <div className="players-list">
            {players.map((player, index) => {
              const isMe = player === myPlayerName;
              return (
                <div
                  key={index}
                  className={`player-tag ${isMe ? "is-me" : ""}`}
                >
                  <span>
                    {player} {isMe && <strong>(Tú)</strong>}
                  </span>
                  <button
                    className="remove-player-btn"
                    onClick={() => handleRemovePlayer(index)}
                    title="Eliminar jugador"
                  >
                    ×
                  </button>
                </div>
              );
            })}
            {players.length === 0 && (
              <p className="empty-message">No hay jugadores registrados aún.</p>
            )}
          </div>
        </div>

        <button
          className="start-button"
          disabled={players.length < 2}
          onClick={handleStart}
        >
          Iniciar Partida
        </button>

        {players.length === 1 && (
          <p className="hint-message">Necesitas al menos 2 jugadores.</p>
        )}
      </div>
    </div>
  );
}
