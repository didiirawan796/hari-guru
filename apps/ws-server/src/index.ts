import path from "node:path";
import { createServer } from "node:http";
import cors from "cors";
import { config } from "dotenv";
import express from "express";
import { Server } from "socket.io";

config({ path: path.resolve(process.cwd(), "../../.env") });
config({ path: path.resolve(process.cwd(), ".env") });

const port = Number(process.env.PORT ?? 4000);
const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();

app.use(express.json({ limit: "256kb" }));

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "undian-hari-guru-ws",
    connections: io.engine.clientsCount,
    timestamp: new Date().toISOString(),
  });
});

app.post("/internal/emit", (request, response) => {
  const secret = process.env.WS_INTERNAL_SECRET;
  if (!secret) {
    response.status(503).json({ error: "WS_INTERNAL_SECRET belum diatur." });
    return;
  }
  if (request.get("x-internal-secret") !== secret) {
    response.status(401).json({ error: "Secret internal tidak valid." });
    return;
  }

  const body = request.body as { event?: unknown; payload?: unknown };
  const event = body?.event;
  if (event !== "undian:update" && event !== "undian:drawing") {
    response.status(400).json({ error: "Event tidak didukung." });
    return;
  }

  io.to("public").emit(event, body.payload);
  response.json({ ok: true });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingInterval: 20_000,
  pingTimeout: 20_000,
});

io.on("connection", (socket) => {
  socket.join("public");

  socket.on("public:join", () => {
    socket.join("public");
    socket.emit("public:joined", { room: "public" });
  });

  socket.on("public:leave", () => {
    socket.leave("public");
  });

  socket.emit("server:ready", {
    message: "Terhubung ke server undian.",
    timestamp: new Date().toISOString(),
  });

  socket.on("disconnect", (reason) => {
    console.log(`Socket ${socket.id} terputus: ${reason}`);
  });
});

httpServer.listen(port, () => {
  console.log(`WS server berjalan di port ${port}`);
  console.log(`Origin diizinkan: ${allowedOrigins.join(", ")}`);
});

function shutdown(signal: string): void {
  console.log(`${signal} diterima, menutup server...`);
  io.close();
  httpServer.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
