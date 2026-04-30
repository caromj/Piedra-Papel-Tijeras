let MI_IDENTIFICADOR = null;
let MI_SALA = null;
let socket = null;

async function empezar() {
    const res = await fetch('/entrar');
    const datos = await res.json();

    MI_IDENTIFICADOR = datos.idJugador; // guardas tu id y sala
    MI_SALA = datos.idSala;

    document.getElementById('mi-id').innerText = MI_IDENTIFICADOR;
    document.getElementById('inicio').style.display = 'none';
    document.getElementById('juego').style.display = 'block';

    socket = io(); // crear la conexion socket.io con el servidor 
 
    socket.on('connect', () => {
        socket.emit('registrar', MI_IDENTIFICADOR); // envias tu id jugador al servidor para que te registre en el mapa sockets
    });

    socket.on('estado', (datos) => { // te suscribe al evento estado que el servidor emite estados
        actualizarEstado(datos);
    });
}

function actualizarEstado(datos) {
    if (datos.idSala) MI_SALA = datos.idSala; // si el servidot te asigna sala la guardas 

    if (datos.estado === "JUGANDO") { // si hay botones si no has jugado....
        document.getElementById('info').innerText = "¡Rival encontrado! Elige:";
        if (!datos.elecciones[MI_IDENTIFICADOR]) {
            document.getElementById('controles').style.display = 'block';
        } else {
            document.getElementById('controles').style.display = 'none';
            document.getElementById('info').innerText = "Esperando al rival...";
        }
    }

    if (datos.estado === "FINALIZADO") {
        mostrarResultado(datos.elecciones, datos.jugadores);
        socket.disconnect(); // si la partida termino muestras resultado 
    }
}

async function jugar(opcion) {
    document.getElementById('controles').style.display = 'none';
    document.getElementById('info').innerText = "Enviando jugada...";

    await fetch('/enviar-jugada', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            idJugador: MI_IDENTIFICADOR,
            idSala: MI_SALA,
            jugada: opcion
        })
    });
}

function mostrarResultado(elecciones, jugadores) {
    const rivalID = jugadores.find(id => id !== MI_IDENTIFICADOR);
    const miMovimiento = elecciones[MI_IDENTIFICADOR];
    const rivalMovimiento = elecciones[rivalID];

    let texto = `Tú: ${miMovimiento} vs Rival: ${rivalMovimiento}<br>`;

    if (miMovimiento === rivalMovimiento) texto += "¡Empate!";
    else if (
        (miMovimiento === 'piedra' && rivalMovimiento === 'tijera') ||
        (miMovimiento === 'papel' && rivalMovimiento === 'piedra') ||
        (miMovimiento === 'tijera' && rivalMovimiento === 'papel')
    ) texto += "¡GANASTE!";
    else texto += "PERDISTE";

    document.getElementById('info').innerHTML =
        `<h2>${texto}</h2><button onclick="location.reload()">Reiniciar</button>`;
}

