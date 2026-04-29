import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let COLA_ESPERA = null;
const PARTIDAS = {};
const CONEXIONES = {}; // idJugador → res SSE

// 1. Unirse a la fila
app.get('/entrar', (req, res) => {
    const idJugador = "JUGADOR-" + Math.floor(Math.random() * 10000);

    if (COLA_ESPERA && COLA_ESPERA !== idJugador) {
        const idSala = `SALA-${COLA_ESPERA}-${idJugador}`;

        PARTIDAS[idSala] = {
            jugadores: [COLA_ESPERA, idJugador],
            elecciones: {}
        };

        // Avisar a ambos por SSE
        enviarEvento(COLA_ESPERA, "rival-encontrado", { idSala });
        enviarEvento(idJugador, "rival-encontrado", { idSala });

        COLA_ESPERA = null;

        res.json({ idJugador, idSala, estado: "LISTO" });
    } else {
        COLA_ESPERA = idJugador;
        res.json({ idJugador, idSala: null, estado: "ESPERANDO" });
    }
});

// 2. Canal SSE
app.get('/eventos', (req, res) => {
    const idJugador = req.query.idJugador;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    CONEXIONES[idJugador] = res;

    req.on("close", () => {
        delete CONEXIONES[idJugador];
    });
});

// 3. Registrar jugada
app.post('/enviar-jugada', (req, res) => {
    const { idJugador, idSala, jugada } = req.body;

    if (!PARTIDAS[idSala]) {
        return res.status(404).json({ ok: false });
    }

    PARTIDAS[idSala].elecciones[idJugador] = jugada;

    const partida = PARTIDAS[idSala];
    const jugadores = partida.jugadores;

    // Avisar al rival que ya jugó
    const rival = jugadores.find(j => j !== idJugador);
    enviarEvento(rival, "rival-jugo", {});

    // Si ambos jugaron → finalizado
    if (Object.keys(partida.elecciones).length === 2) {
        enviarEvento(jugadores[0], "finalizado", partida);
        enviarEvento(jugadores[1], "finalizado", partida);
    }

    res.json({ ok: true });
});

// Función para enviar eventos SSE
function enviarEvento(idJugador, tipo, data) {
    const conn = CONEXIONES[idJugador];
    if (!conn) return;

    conn.write(`event: ${tipo}\n`);
    conn.write(`data: ${JSON.stringify(data)}\n\n`);
}

app.listen(process.env.POLL_PUERTO_HTTP, () =>
    console.log("Servidor SSE en http://localhost:" + process.env.SSE_PUERTO_HTTP)
);









