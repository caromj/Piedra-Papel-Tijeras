import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

//  Configuración de rutas
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PUERTO = process.env.WS_PUERTO_HTTP || 3003;

//  Servidor HTTP + Express
const aplicacion = express();
const servidorHttp = http.createServer(aplicacion);

//  Servidor WebSocket
const servidorSocket = new Server(servidorHttp, {
  cors: { origin: "*" }
});

//  Servir archivos 
aplicacion.use(express.static(join(__dirname, "public")));

//  Variables del juego
let listaJugadores = {};
let elecciones = {};

//  Lógica para decidir ganador
function obtenerGanador(e1, e2) {
  if (e1 === e2) return "empate";

  if (
    (e1 === "piedra" && e2 === "tijeras") ||
    (e1 === "tijeras" && e2 === "papel") ||
    (e1 === "papel" && e2 === "piedra")
  ) {
    return "jugador1";
  }

  return "jugador2";
}

//  Eventos de conexión WebSocket
servidorSocket.on("connection", (socket) => {
  console.log("Jugador conectado:", socket.id);

  listaJugadores[socket.id] = true;
  servidorSocket.emit("jugadores", Object.keys(listaJugadores));
  //  Cuando un jugador elige
  socket.on("eleccion", (eleccion) => {
    elecciones[socket.id] = eleccion;

    // Si ya eligieron 2 jugadores
    if (Object.keys(elecciones).length === 2) {
      const ids = Object.keys(elecciones);
      const jugador1 = ids[0];
      const jugador2 = ids[1];

      const ganador = obtenerGanador(
        elecciones[jugador1],
        elecciones[jugador2]
      );
      servidorSocket.emit("resultado", {
        jugador1: { id: jugador1, eleccion: elecciones[jugador1] },
        jugador2: { id: jugador2, eleccion: elecciones[jugador2] },
        ganador
      });

      elecciones = {}; // Reiniciar ronda
    }
  });
//  Cuando un jugador se desconecta
  socket.on("disconnect", () => {
    delete listaJugadores[socket.id];
    delete elecciones[socket.id];

    servidorSocket.emit("jugadores", Object.keys(listaJugadores));
  });
});

servidorHttp.listen(PUERTO, () => {
  console.log(`Servidor WebSocket escuchando en el puerto ${PUERTO}`);
});



