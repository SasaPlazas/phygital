import { useState, useEffect } from "react";
import RegistrationScreen from "./components/RegistrationScreen";
import OrderScreen from "./components/OrderScreen";
import TurnAnnouncement from "./components/TurnAnnouncement";
import TriviaScreen from "./components/TriviaScreen";
import RecapScreen from "./components/RecapScreen";
import FinalScreen from "./components/FinalScreen";
import { socket } from "./socket";
import "./App.css";

function App() {
  const [gameState, setGameState] = useState("REGISTRATION"); // 'REGISTRATION' | 'ORDER' | 'ANNOUNCEMENT' | 'TRIVIA' | 'RECAP' | 'FINAL'
  const [gameData, setGameData] = useState({
    players: [],
    totalRounds: 0,
    currentRound: 1,
    currentPlayer: null,
    turnStats: { soldiers: 0, movements: 0 },
    finalPlayers: [],
  });

  const [myPlayerName, setMyPlayerName] = useState(() => {
    return sessionStorage.getItem("myPlayerName") || "";
  });

  useEffect(() => {
    if (myPlayerName) {
      sessionStorage.setItem("myPlayerName", myPlayerName);
    }
  }, [myPlayerName]);

  useEffect(() => {
    function onGameStarted(data) {
      console.log("Game started event received:", data);
      setGameData((prev) => ({
        ...prev,
        players: data.players,
        totalRounds: data.totalRounds,
      }));
      setGameState("ORDER");
    }

    function onTurnAnnouncement(data) {
      console.log("Turn announcement:", data);
      setGameData((prev) => ({
        ...prev,
        currentPlayer: data.player,
        currentRound: data.round,
        totalRounds: data.totalRounds,
      }));
      setGameState("ANNOUNCEMENT");
    }

    function onTriviaStarted() {
      console.log("Trivia started");
      setGameState("TRIVIA");
    }

    function onTurnRecap(data) {
      console.log("Turn recap:", data);
      setGameData((prev) => ({
        ...prev,
        turnStats: { soldiers: data.soldiers, movements: data.movements },
        currentPlayer: data.player,
      }));
      setGameState("RECAP");
    }

    function onGameOver(data) {
      console.log("Game over:", data);
      setGameData((prev) => ({
        ...prev,
        finalPlayers: data.players,
      }));
      setGameState("FINAL");
    }

    function onGameReset() {
      console.log("Game reset");
      setGameState("REGISTRATION");
      setGameData({
        players: [],
        totalRounds: 0,
        currentRound: 1,
        currentPlayer: null,
        turnStats: { soldiers: 0, movements: 0 },
        finalPlayers: [],
      });
    }

    socket.on("game_started", onGameStarted);
    socket.on("turn_announcement", onTurnAnnouncement);
    socket.on("trivia_started", onTriviaStarted);
    socket.on("turn_recap", onTurnRecap);
    socket.on("game_over", onGameOver);
    socket.on("game_reset", onGameReset);

    return () => {
      socket.off("game_started", onGameStarted);
      socket.off("turn_announcement", onTurnAnnouncement);
      socket.off("trivia_started", onTriviaStarted);
      socket.off("turn_recap", onTurnRecap);
      socket.off("game_over", onGameOver);
      socket.off("game_reset", onGameReset);
    };
  }, []);

  // Identity check removed per user request

  return (
    <>
      {gameState === "REGISTRATION" && (
        <RegistrationScreen
          setMyPlayerName={setMyPlayerName}
          myPlayerName={myPlayerName}
        />
      )}
      {gameState === "ORDER" && <OrderScreen players={gameData.players} />}
      {gameState === "ANNOUNCEMENT" && (
        <TurnAnnouncement
          player={gameData.currentPlayer}
          round={gameData.currentRound}
          totalRounds={gameData.totalRounds}
          myPlayerName={myPlayerName}
        />
      )}
      {gameState === "TRIVIA" && (
        <TriviaScreen
          key={gameData.currentPlayer?.name || "trivia"}
          player={gameData.currentPlayer}
          myPlayerName={myPlayerName}
          round={gameData.currentRound}
        />
      )}
      {gameState === "RECAP" && (
        <RecapScreen
          turnStats={gameData.turnStats}
          player={gameData.currentPlayer}
          myPlayerName={myPlayerName}
        />
      )}
      {gameState === "FINAL" && (
        <FinalScreen finalPlayers={gameData.finalPlayers} />
      )}
    </>
  );
}

export default App;
