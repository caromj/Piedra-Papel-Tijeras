import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();
console.log(process.env.NOMBRE_JUEGO);

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let COLA_ESPERA = null; // creamos un cajon vacion, y se guardara el id de la persona que llega al juego
const PARTIDAS = {}; // un diccionaro donde se guarda las partidas activas

// 1. Unirse a la fila
app.get('/entrar', (req, res) => {
    const idJugador = "JUGADOR-" + Math.floor(Math.random() * 10000); //crea un nombre unico usuario
    
    if (COLA_ESPERA && COLA_ESPERA !== idJugador) {
        const idSala = `SALA-${COLA_ESPERA}-${idJugador}`;
        PARTIDAS[idSala] = {
            jugadores: [COLA_ESPERA, idJugador],
            elecciones: {}
        };
        const rival = COLA_ESPERA;
        COLA_ESPERA = null; // Limpiar cola
        res.json({ idJugador, idSala, estado: "LISTO" });
    } else {
        COLA_ESPERA = idJugador;
        res.json({ idJugador, idSala: null, estado: "ESPERANDO" });
    }
});

// 2. Ver estado (Polling)
app.get('/ver-estado/:idJugador', (req, res) => {
    const { idJugador } = req.params;

    // Buscamos en qué sala está metido este jugador
    const idSala = Object.keys(PARTIDAS).find(id => PARTIDAS[id].jugadores.includes(idJugador));

    if (!idSala) {
        return res.json({ estado: "ESPERANDO" });
    }

    const partida = PARTIDAS[idSala];
    const jugadasRealizadas = Object.keys(partida.elecciones).length;

    res.json({
        estado: jugadasRealizadas === 2 ? "FINALIZADO" : "JUGANDO",
        idSala: idSala, // Enviamos el ID de sala para que el cliente lo guarde
        elecciones: partida.elecciones,
        jugadores: partida.jugadores
    });
});

// 3. Registrar jugada
app.post('/enviar-jugada', (req, res) => {
    const { idJugador, idSala, jugada } = req.body;
    if (PARTIDAS[idSala]) {
        PARTIDAS[idSala].elecciones[idJugador] = jugada;
        res.json({ ok: true });
    } else {
        res.status(404).json({ ok: false, error: "Sala no encontrada" });
    }
});

app.listen(process.env.PUERTO, () => console.log("Servidor en http://localhost:"+process.env.PUERTO));






