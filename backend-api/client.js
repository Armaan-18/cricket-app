const { io } = require("socket.io-client");

const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("Connected:", socket.id);
  socket.emit("joinMatch", { matchId: 1001 });
});

socket.on("joinedMatch", (data) => {
  console.log("Joined match:", data);
});

socket.on("recentCommentary", (data) => {
  console.log("Recent commentary:", data);
});

socket.on("newCommentary", (data) => {
  console.log("New commentary:", data);
});
