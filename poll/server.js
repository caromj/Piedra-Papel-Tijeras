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

let COLA_ESPERA = null; // creamos un cajón vacio, y se guardara el id de la persona que llega al juego
const PARTIDAS = {}; // un objeto donde cada clave es la sala y el valor es jugadores y elecciones 

// 1. Unirse a la fila
app.get('/entrar', (req, res) => {
    const idJugador = "JUGADOR-" + Math.floor(Math.random() * 10000); //crea un nombre unico usuario
    
    if (COLA_ESPERA && COLA_ESPERA !== idJugador) { // si hay alguien en la cola crea una sala 
        const idSala = `SALA-${COLA_ESPERA}-${idJugador}`;
        PARTIDAS[idSala] = { // guarda en partida el array de los jugadores y la eleciones de los jugadores 
            jugadores: [COLA_ESPERA, idJugador],
            elecciones: {}
        };
        const rival = COLA_ESPERA;
        COLA_ESPERA = null; // Limpiar cola
        res.json({ idJugador, idSala, estado: "LISTO" }); // ya tiene rival 
    } else {
        COLA_ESPERA = idJugador;
        res.json({ idJugador, idSala: null, estado: "ESPERANDO" }); // si no hay nadie esperando meterlo en cola espera y esta esperando
    }
});

// 2. Ver estado (Polling)
app.get('/ver-estado/:idJugador', (req, res) => { // extrael el idjugador de la url
    const { idJugador } = req.params;
    console.log('Me ha preguntado por el estado el jugador ' + idJugador);

    // Buscamos en qué sala está metido este jugador
    const idSala = Object.keys(PARTIDAS).find(id => PARTIDAS[id].jugadores.includes(idJugador)); // recorre todas las claves de partidas 
    // y se queda con la primera donde jugadores contenga id jugador

    if (!idSala) {
        return res.json({ estado: "ESPERANDO" }); // si no esta en sala sigue esperando
    }

    const partida = PARTIDAS[idSala];// recupera la partida
    const jugadasRealizadas = Object.keys(partida.elecciones).length; // cuenta cuantas jugadas se ha hecho 

    res.json({
        estado: jugadasRealizadas === 2 ? "FINALIZADO" : "JUGANDO", // si hay 2 jugadas finalizado si no jugando 
        idSala: idSala, // Enviamos el ID de sala para que el cliente lo guarde
        elecciones: partida.elecciones,
        jugadores: partida.jugadores
    });
});

// 3. Registrar jugada
app.post('/enviar-jugada', (req, res) => {
    const { idJugador, idSala, jugada } = req.body; // extrae quien juega, que sala y que jugada hace 
    if (PARTIDAS[idSala]) {
        PARTIDAS[idSala].elecciones[idJugador] = jugada;
        res.json({ ok: true });
    } else {
        res.status(404).json({ ok: false, error: "Sala no encontrada" });
    }
});

app.listen(process.env.POLL_PUERTO_HTTP, () => console.log("Servidor en http://localhost:"+process.env.POLL_PUERTO_HTTP));








