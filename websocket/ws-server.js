import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*"
    }
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let COLA_ESPERA = null; // jugador esperando rival 
const PARTIDAS = {}; // saldas con jugadores y elecciones 
const SOCKETS = new Map(); // mapa de id jugadores 

// se ejecuta cada vez que un cliente se conecta via socket
io.on('connection', (socket) => {
    socket.on('registrar', (idJugador) => { //el cliente al conectarse encia su id jugador 
        SOCKETS.set(idJugador, socket); // lo guardamos en mapa socket para poder encontrar su socket mas tarde

        socket.on('disconnect', () => {
            SOCKETS.delete(idJugador); // eliminamos su entrada del mapa
        });
    });
});

// Función para enviar estado por socket
function enviarEstado(idJugador) { // buscamos socket asociado a ese jugador 
    const socket = SOCKETS.get(idJugador);
    if (!socket) return;

    const datos = verEstado(idJugador); // calculamos estado del jugador 
    socket.emit('estado', datos); // eviamos un evento esta do al cliente con esos datos
}

// ver estado
function verEstado(idJugador) {
    const idSala = Object.keys(PARTIDAS).find(id => PARTIDAS[id].jugadores.includes(idJugador)); // buscamos en que sala esta este jugador 

    if (!idSala) {
        return { estado: "ESPERANDO" }; // si no en ninguna sigue esperando
    }

    const partida = PARTIDAS[idSala]; // recupera la partida 
    const jugadasRealizadas = Object.keys(partida.elecciones).length; // cuenta cuantas jugadas se ha echo (de momento no hace falta, no hay contadores)

    return { // devuelve el estado, la sala, las elecciones y los jugadores 
        estado: jugadasRealizadas === 2 ? "FINALIZADO" : "JUGANDO",
        idSala,
        elecciones: partida.elecciones,
        jugadores: partida.jugadores
    };
}

// 1. Unirse a la fila 
app.get('/entrar', (req, res) => { // crea un id jugador
    const idJugador = "JUGADOR-" + Math.floor(Math.random() * 10000);

    if (COLA_ESPERA && COLA_ESPERA !== idJugador) { // si hay alguien esperando crea sala, mete ambos jugadores
        const idSala = `SALA-${COLA_ESPERA}-${idJugador}`;
        PARTIDAS[idSala] = {
            jugadores: [COLA_ESPERA, idJugador],
            elecciones: {}
        };

        const rival = COLA_ESPERA;
        COLA_ESPERA = null; // limpia cola y responde al nuevo jugador 

        res.json({ idJugador, idSala, estado: "LISTO" });

        // Cuando haya sockets registrados, mandamos estado a ambos
        enviarEstado(idJugador);
        enviarEstado(rival);

    } else {
        COLA_ESPERA = idJugador; // si no hay nadie esperando guardar jugador ne cola y muestra estar esperando
        res.json({ idJugador, idSala: null, estado: "ESPERANDO" });
    }
});

// recibe la jugada del cliente 
app.post('/enviar-jugada', (req, res) => {
    const { idJugador, idSala, jugada } = req.body;

    if (PARTIDAS[idSala]) { // si la sala existe guarda la jugada 
        PARTIDAS[idSala].elecciones[idJugador] = jugada;
        res.json({ ok: true });

        const estado1 = verEstado(idJugador); // calcular estado del jugador 
        const rival = estado1.jugadores.find(j => j !== idJugador); // encuentra rival 

        enviarEstado(idJugador); // envia el estado de ambos
        enviarEstado(rival);

    } else {
        res.status(404).json({ ok: false, error: "Sala no encontrada" }); // no me sirve si la sala no existe (hacer pruebas)
    }
});

httpServer.listen(process.env.WS_PUERTO_HTTP, () =>
    console.log("Socket.IO en http://localhost:" + process.env.WS_PUERTO_HTTP)
);



