let MI_IDENTIFICADOR = null;
let MI_SALA = null;
let fuente = null;

async function empezar() {
    const res = await fetch('/entrar');
    const datos = await res.json();

    MI_IDENTIFICADOR = datos.idJugador;
    MI_SALA = datos.idSala;

    document.getElementById('mi-id').innerText = MI_IDENTIFICADOR;
    document.getElementById('inicio').style.display = 'none';
    document.getElementById('juego').style.display = 'block';

    // Conectar SSE
    fuente = new EventSource(`/stream/${MI_IDENTIFICADOR}`);
    fuente.addEventListener("estado", (e) => { // suscribes al evento estado enviado por el servidor 
        const datos = JSON.parse(e.data);
        actualizarEstado(datos);
    });
}

function actualizarEstado(datos) { 
    if (datos.idSala) MI_SALA = datos.idSala; // si el servidor te asigna sala la guardamos 

    if (datos.estado === "JUGANDO") { // si hay rival muestra botones 
        document.getElementById('info').innerText = "¡Rival encontrado! Elige:"; 
        if (!datos.elecciones[MI_IDENTIFICADOR]) { 
            document.getElementById('controles').style.display = 'block';
        } else {
            document.getElementById('controles').style.display = 'none';
            document.getElementById('info').innerText = "Esperando al rival...";
        }
    }

    if (datos.estado === "FINALIZADO") { // si la partia termono cierras la conexion sse y muestras resultado 
        fuente.close();
        mostrarResultado(datos.elecciones, datos.jugadores);
    }
}

async function jugar(opcion) { // envias tu jugada al servidor 
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



