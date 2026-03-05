import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

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
let totalRounds = 0;

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

    // Shuffle players and assign colors
    const shuffledNames = shuffleArray([...players]);
    orderedPlayers = shuffledNames.map((name) => ({
      name,
      color: getRandomColor(),
      soldiers: 0,
    }));

    totalRounds = orderedPlayers.length <= 4 ? 8 : 10;
    currentRound = 1;
    currentPlayerIndex = 0;

    console.log("Game started! Order:", orderedPlayers);

    io.emit("game_started", {
      players: orderedPlayers,
      totalRounds,
    });
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
    io.emit("trivia_started");
  });

  // End Turn / Trivia Finished (Go to Recap)
  socket.on("end_turn", ({ score, timeRemaining }) => {
    const soldiers = score; // 1 soldier per correct answer
    const movements = Math.floor(timeRemaining / 5);

    // Update player stats (optional, but good for persistence)
    orderedPlayers[currentPlayerIndex].soldiers += soldiers;

    io.emit("turn_recap", {
      soldiers,
      movements,
      player: orderedPlayers[currentPlayerIndex],
    });
  });

  // Next Turn Request (From Recap Screen)
  socket.on("next_turn_request", () => {
    currentPlayerIndex++;

    // Check if round is finished
    if (currentPlayerIndex >= orderedPlayers.length) {
      currentPlayerIndex = 0;
      currentRound++;
    }

    // Check if game is finished
    if (currentRound > totalRounds) {
      io.emit("game_over", {
        players: orderedPlayers, // Send final stats
      });
    } else {
      // Next player's turn
      const nextPlayer = orderedPlayers[currentPlayerIndex];
      io.emit("turn_announcement", {
        player: nextPlayer,
        round: currentRound,
        totalRounds,
      });
    }
  });

  // Reset game
  socket.on("reset_game", () => {
    gameStarted = false;
    players = [];
    orderedPlayers = [];
    currentRound = 1;
    currentPlayerIndex = 0;
    totalRounds = 0;

    io.emit("game_reset");
    io.emit("update_players", []);
    console.log("Game reset");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
