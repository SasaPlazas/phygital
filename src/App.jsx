import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import RegistrationScreen from "./components/RegistrationScreen";
import OrderScreen from "./components/OrderScreen";
import TurnAnnouncement from "./components/TurnAnnouncement";
import TriviaScreen from "./components/TriviaScreen";
import RecapScreen from "./components/RecapScreen";
import AttackScreen from "./components/AttackScreen";
import FinalScreen from "./components/FinalScreen";
import { socket } from "./socket";
import "./App.css";

function GameNavigator() {
  const navigate = useNavigate();
  // eslint-disable-next-line no-unused-vars
  const [gameState, setGameState] = useState("REGISTRATION"); // Kept for reference but not for navigation
  const [gameData, setGameData] = useState({
    players: [],
    totalRounds: 0,
    currentRound: 1,
    currentPlayer: null,
    turnStats: { soldiers: 0, movements: 0 },
    finalPlayers: [],
    questions: [],
    questionIndices: [],
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
      navigate("/order");
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
      navigate("/announcement");
    }

    function onTriviaStarted(data) {
      console.log("Trivia started:", data);
      setGameData((prev) => ({
        ...prev,
        questions: data.questions,
        questionIndices: data.indices || [],
      }));
      setGameState("TRIVIA");
      navigate("/trivia");
    }

    function onTurnRecap(data) {
      console.log("Turn recap:", data);
      setGameData((prev) => ({
        ...prev,
        turnStats: { soldiers: data.soldiers, movements: data.movements },
        currentPlayer: data.player,
      }));
      setGameState("RECAP");
      navigate("/recap");
    }

    function onAttackStarted(data) {
      console.log("Attack started:", data);
      setGameData((prev) => ({
        ...prev,
        currentPlayer: data.player,
      }));
      setGameState("ATTACK");
      navigate("/attack");
    }

    function onGameOver(data) {
      console.log("Game over:", data);
      setGameData((prev) => ({
        ...prev,
        finalPlayers: data.players,
      }));
      setGameState("FINAL");
      navigate("/final");
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
        questions: [],
        questionIndices: [],
      });
      // Clear local player identity on game reset so they can re-register
      setMyPlayerName("");
      sessionStorage.removeItem("myPlayerName");
      navigate("/");
    }

    socket.on("game_started", onGameStarted);
    socket.on("turn_announcement", onTurnAnnouncement);
    socket.on("trivia_started", onTriviaStarted);
    socket.on("turn_recap", onTurnRecap);
    socket.on("attack_started", onAttackStarted);
    socket.on("game_over", onGameOver);
    socket.on("game_reset", onGameReset);

    return () => {
      socket.off("game_started", onGameStarted);
      socket.off("turn_announcement", onTurnAnnouncement);
      socket.off("trivia_started", onTriviaStarted);
      socket.off("turn_recap", onTurnRecap);
      socket.off("attack_started", onAttackStarted);
      socket.off("game_over", onGameOver);
      socket.off("game_reset", onGameReset);
    };
  }, [navigate]);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <RegistrationScreen
            setMyPlayerName={setMyPlayerName}
            myPlayerName={myPlayerName}
          />
        }
      />
      <Route
        path="/order"
        element={
          <OrderScreen
            players={gameData.players}
            totalRounds={gameData.totalRounds}
          />
        }
      />
      <Route
        path="/announcement"
        element={
          <TurnAnnouncement
            player={gameData.currentPlayer}
            round={gameData.currentRound}
            totalRounds={gameData.totalRounds}
            myPlayerName={myPlayerName}
          />
        }
      />
      <Route
        path="/trivia"
        element={
          <TriviaScreen
            key={gameData.currentPlayer?.name || "trivia"}
            player={gameData.currentPlayer}
            myPlayerName={myPlayerName}
            round={gameData.currentRound}
            questions={gameData.questions}
            questionIndices={gameData.questionIndices}
          />
        }
      />
      <Route
        path="/recap"
        element={
          <RecapScreen
            turnStats={gameData.turnStats}
            player={gameData.currentPlayer}
            myPlayerName={myPlayerName}
          />
        }
      />
      <Route
        path="/attack"
        element={
          <AttackScreen
            player={gameData.currentPlayer}
            myPlayerName={myPlayerName}
          />
        }
      />
      <Route
        path="/final"
        element={<FinalScreen players={gameData.finalPlayers} />}
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <GameNavigator />
    </BrowserRouter>
  );
}

export default App;
