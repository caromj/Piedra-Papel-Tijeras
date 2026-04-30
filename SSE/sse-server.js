import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config(); // carga variables entorno

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let COLA_ESPERA = null;
const PARTIDAS = {};
const CLIENTES = new Map(); //cuardamos cada conexion sse y la clave del idjugador

//  1. Conexión SSE
app.get('/stream/:idJugador', (req, res) => {
    const { idJugador } = req.params; // el cliente abre conexión sse y extraemos jugador 

    res.setHeader("Content-Type", "text/event-stream"); //formato SSE
    res.setHeader("Cache-Control", "no-cache"); // evita que el navegador guarde respuesta 
    res.setHeader("Connection", "keep-alive"); // mantiene conexión abierta
    res.flushHeaders(); // envia cabeceras inmediatamente

    CLIENTES.set(idJugador, res); // guardamos la conexion SSE en el mapa 

    req.on("close", () => {
        CLIENTES.delete(idJugador); // si cierra pestaña eliminamos la conexión
    });
});

// buscamos la conexion sse del jugador
function enviarEvento(idJugador, tipo, data) {
    const cliente = CLIENTES.get(idJugador);
    if (!cliente) return;

    cliente.write(`event: ${tipo}\n`); // esto envia un evento SSE
    cliente.write(`data: ${JSON.stringify(data)}\n\n`);
}

//  llama a la logica del juego y devuelve id jugador, id isla y estado
app.get('/entrar', (req, res) => {
    const idJugador = "JUGADOR-" + Math.floor(Math.random() * 10000);

    if (COLA_ESPERA && COLA_ESPERA !== idJugador) {
        const idSala = `SALA-${COLA_ESPERA}-${idJugador}`;
        PARTIDAS[idSala] = {
            jugadores: [COLA_ESPERA, idJugador],
            elecciones: {}
        };

        const rival = COLA_ESPERA;
        COLA_ESPERA = null;

        res.json({ idJugador, idSala, estado: "LISTO" });

        // Avisar por SSE a ambos jugadores
        const estado1 = verEstado(idJugador);
        const estado2 = verEstado(rival);

        enviarEvento(idJugador, "estado", estado1);
        enviarEvento(rival, "estado", estado2);

    } else {
        COLA_ESPERA = idJugador;
        res.json({ idJugador, idSala: null, estado: "ESPERANDO" });
    }
});

//  3. Ver estado 
function verEstado(idJugador) {
    const idSala = Object.keys(PARTIDAS).find(id => PARTIDAS[id].jugadores.includes(idJugador));

    if (!idSala) {
        return { estado: "ESPERANDO" };
    }

    const partida = PARTIDAS[idSala];
    const jugadasRealizadas = Object.keys(partida.elecciones).length;

    return {
        estado: jugadasRealizadas === 2 ? "FINALIZADO" : "JUGANDO",
        idSala,
        elecciones: partida.elecciones,
        jugadores: partida.jugadores
    };
}

// 4. Registrar jugada 
app.post('/enviar-jugada', (req, res) => {
    const { idJugador, idSala, jugada } = req.body;

    if (PARTIDAS[idSala]) {
        PARTIDAS[idSala].elecciones[idJugador] = jugada;
        res.json({ ok: true });

        const estado1 = verEstado(idJugador); // calculamos el estado del jugador, buscamos rival y calculamos el estado dle rival 
        const rival = estado1.jugadores.find(j => j !== idJugador);
        const estado2 = verEstado(rival);

        enviarEvento(idJugador, "estado", estado1); // enviamos el estado acutalizado a ambos jugadores
        enviarEvento(rival, "estado", estado2);

    } else {
        res.status(404).json({ ok: false, error: "Sala no encontrada" });
    }
});

app.listen(process.env.SSE_PUERTO_HTTP, () =>
    console.log("Servidor SSE en http://localhost:" + process.env.SSE_PUERTO_HTTP)
);













