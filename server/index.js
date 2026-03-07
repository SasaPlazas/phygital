import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import {
  easyTriviaQuestions,
  mediumTriviaQuestions,
  hardTriviaQuestions,
} from "../src/questions.js";

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Game state
let players = [];
let gameStarted = false;
let orderedPlayers = [];
let currentRound = 1;
let currentPlayerIndex = 0;
let totalRounds = 8;
let gameHistory = []; // Stores round-by-round stats

// Used questions tracking (by index in their respective arrays)
// Structure: { easy: Set<number>, medium: Set<number>, hard: Set<number> }
let usedQuestionIndices = {
  easy: new Set(),
  medium: new Set(),
  hard: new Set(),
};

// Helper to shuffle array (Fisher-Yates)
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Helper to generate random color
const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Send current state to the new client
  if (gameStarted) {
    socket.emit("game_started", {
      players: orderedPlayers,
      totalRounds: totalRounds,
    });
  } else {
    socket.emit("update_players", players);
  }

  // Handle adding a player
  socket.on("add_player", (playerName) => {
    if (gameStarted) return; // Prevent adding players after start

    if (!players.includes(playerName)) {
      players.push(playerName);
      io.emit("update_players", players);
      console.log(`Player added: ${playerName}. Total: ${players.length}`);
    }
  });

  // Handle removing a player
  socket.on("remove_player", (indexToRemove) => {
    if (gameStarted) return;

    if (indexToRemove >= 0 && indexToRemove < players.length) {
      const removed = players.splice(indexToRemove, 1);
      io.emit("update_players", players);
      console.log(`Player removed: ${removed}. Total: ${players.length}`);
    }
  });

  // Handle explicit request for players list (e.g. on component mount)
  socket.on("request_players", () => {
    socket.emit("update_players", players);
  });

  // Handle start game
  socket.on("start_game", () => {
    if (players.length < 2) return;

    gameStarted = true;
    currentRound = 1;
    currentPlayerIndex = 0;
    gameHistory = []; // Reset history

    // Shuffle players for random turn order
    const shuffledPlayers = [...players];
    for (let i = shuffledPlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledPlayers[i], shuffledPlayers[j]] = [
        shuffledPlayers[j],
        shuffledPlayers[i],
      ];
    }

    orderedPlayers = shuffledPlayers.map((name) => ({
      name,
      color: getRandomColor(),
      score: 0,
    }));

    // Clear used questions
    usedQuestionIndices = {
      easy: new Set(),
      medium: new Set(),
      hard: new Set(),
    };

    io.emit("game_started", {
      players: orderedPlayers,
      totalRounds: totalRounds,
    });

    console.log("Game started with:", orderedPlayers);
  });

  // Start Rounds (Go to Turn Announcement)
  socket.on("start_rounds", () => {
    // Emit info for the first player of the first round
    const currentPlayer = orderedPlayers[currentPlayerIndex];
    io.emit("turn_announcement", {
      player: currentPlayer,
      round: currentRound,
      totalRounds,
    });
  });

  // Start Trivia (Go to Trivia Screen)
  socket.on("start_trivia", () => {
    // Determine difficulty based on round
    let category = "easy";
    let sourceQuestions = easyTriviaQuestions;

    if (currentRound >= 3 && currentRound <= 5) {
      category = "medium";
      sourceQuestions = mediumTriviaQuestions;
    } else if (currentRound >= 6) {
      category = "hard";
      sourceQuestions = hardTriviaQuestions;
    }

    // Filter out used questions for this category
    // Note: We track usage globally per game to ensure variety
    // If we run out, we reset the usage for that category
    let availableIndices = sourceQuestions
      .map((_, index) => index)
      .filter((index) => !usedQuestionIndices[category].has(index));

    if (availableIndices.length === 0) {
      // Reset if exhausted
      usedQuestionIndices[category].clear();
      availableIndices = sourceQuestions.map((_, index) => index);
    }

    // Shuffle available indices
    const shuffledIndices = shuffleArray([...availableIndices]);

    // Select up to 20 questions
    const selectedIndices = shuffledIndices.slice(0, 20);

    // Mark selected as used
    selectedIndices.forEach((index) =>
      usedQuestionIndices[category].add(index)
    );

    // Get the actual question objects
    const turnQuestions = selectedIndices.map(
      (index) => sourceQuestions[index]
    );

    // Send questions to the client
    io.emit("trivia_started", { questions: turnQuestions });
  });

  // Handle end of turn (after trivia)
  socket.on("end_turn", (data) => {
    const { correctAnswers, timeLeft } = data;
    const soldiers = correctAnswers; // 1 soldier per correct answer
    const movements = Math.floor(timeLeft / 5); // 1 movement per 5s remaining

    // Update current player stats
    if (orderedPlayers[currentPlayerIndex]) {
      orderedPlayers[currentPlayerIndex].soldiers =
        (orderedPlayers[currentPlayerIndex].soldiers || 0) + soldiers;
      orderedPlayers[currentPlayerIndex].movements =
        (orderedPlayers[currentPlayerIndex].movements || 0) + movements;
    }

    // Record history
    gameHistory.push({
      round: currentRound,
      player: orderedPlayers[currentPlayerIndex]?.name,
      soldiers,
      movements,
      correctAnswers,
      timeLeft,
      timestamp: new Date().toISOString(),
    });

    // Emit results to show on client (e.g. "You got X soldiers!")
    // Sending 'turn_recap' to match client expectation
    socket.emit("turn_recap", {
      player: orderedPlayers[currentPlayerIndex],
      soldiers,
      movements,
      correctAnswers,
    });
  });

  // Handle request for next turn
  socket.on("next_turn_request", () => {
    // Advance player
    currentPlayerIndex++;
    if (currentPlayerIndex >= orderedPlayers.length) {
      currentPlayerIndex = 0;
      currentRound++;
    }

    // Check game over
    if (currentRound > totalRounds) {
      io.emit("game_over", {
        players: orderedPlayers,
        history: gameHistory,
      });
    } else {
      // Announce next turn
      const nextPlayer = orderedPlayers[currentPlayerIndex];
      io.emit("turn_announcement", {
        player: nextPlayer,
        round: currentRound,
        totalRounds,
      });
    }
  });

  socket.on("game_reset", () => {
    gameStarted = false;
    players = [];
    orderedPlayers = [];
    currentRound = 1;
    currentPlayerIndex = 0;
    totalRounds = 8;
    gameHistory = [];

    io.emit("game_reset");
    io.emit("update_players", []);
    console.log("Game reset");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// API Endpoint for game history
app.get("/api/game-history", (req, res) => {
  res.json(gameHistory);
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
