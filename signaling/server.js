const http = require("http");
const WebSocket = require("ws");

const PORT = Number(process.env.PORT) || 8080;

const HOST = "0.0.0.0";

const rooms = new Map();

const httpServer = http.createServer(
  (req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, {
        "Content-Type": "application/json",
      });

      res.end(
        JSON.stringify({
          status: "ok",
          service: "webrtc-signaling",
        }),
      );

      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/plain",
    });

    res.end(
      "WebRTC signaling server is running.",
    );
  },
);

const wss = new WebSocket.Server({
  server: httpServer,
});

function send(ws, message) {
  if (
    ws.readyState === WebSocket.OPEN
  ) {
    ws.send(
      JSON.stringify(message),
    );
  }
}

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(
      roomId,
      new Set(),
    );
  }

  return rooms.get(roomId);
}

function broadcast(
  roomId,
  sender,
  message,
) {
  const room = rooms.get(roomId);

  if (!room) {
    return;
  }

  for (const client of room) {
    if (client !== sender) {
      send(client, message);
    }
  }
}

wss.on(
  "connection",
  (ws) => {
    let roomId = null;

    console.log(
      "[Signaling] Client connected",
    );

    ws.on(
      "message",
      (raw) => {
        try {
          const message =
            JSON.parse(
              raw.toString(),
            );

          switch (message.type) {
            case "join": {
              const requestedRoom =
                String(
                  message.roomId || "",
                )
                  .trim()
                  .toUpperCase();

              if (!requestedRoom) {
                send(ws, {
                  type: "error",
                  message:
                    "Room ID is required.",
                });

                return;
              }

              const room =
                getRoom(
                  requestedRoom,
                );

              if (room.size >= 2) {
                send(ws, {
                  type: "error",
                  message:
                    "Room is full.",
                });

                return;
              }

              roomId =
                requestedRoom;

              room.add(ws);

              console.log(
                `[Signaling] ${requestedRoom}: ${room.size}/2`,
              );

              send(ws, {
                type: "joined",
                roomId:
                  requestedRoom,
                peerCount:
                  room.size,
              });

              if (room.size === 2) {
                broadcast(
                  requestedRoom,
                  ws,
                  {
                    type:
                      "peer-ready",
                  },
                );
              }

              break;
            }

            case "offer":
            case "answer":
            case "ice-candidate": {
              if (!roomId) {
                return;
              }

              broadcast(
                roomId,
                ws,
                message,
              );

              break;
            }

            case "leave": {
              cleanup();
              break;
            }

            default: {
              send(ws, {
                type: "error",
                message:
                  `Unknown message: ${message.type}`,
              });
            }
          }
        } catch (error) {
          console.error(
            "[Signaling] Invalid message:",
            error,
          );

          send(ws, {
            type: "error",
            message:
              "Invalid signaling message.",
          });
        }
      },
    );

    ws.on("close", () => {
      console.log(
        "[Signaling] Client disconnected",
      );

      cleanup();
    });

    ws.on("error", (error) => {
      console.error(
        "[Signaling] WebSocket error:",
        error,
      );
    });

    function cleanup() {
      if (!roomId) {
        return;
      }

      const room =
        rooms.get(roomId);

      if (!room) {
        roomId = null;
        return;
      }

      room.delete(ws);

      broadcast(
        roomId,
        ws,
        {
          type: "peer-left",
        },
      );

      if (room.size === 0) {
        rooms.delete(roomId);
      }

      console.log(
        `[Signaling] Room ${roomId}: ${room.size}/2`,
      );

      roomId = null;
    }
  },
);

httpServer.listen(
  PORT,
  HOST,
  () => {
    console.log(
      `[Signaling] Server listening on ${HOST}:${PORT}`,
    );
  },
);