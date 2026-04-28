let MI_IDENTIFICADOR = null;
let MI_SALA = null;
let INTERVALO = null;
const intervaloPoll = 1;

async function empezar() {
    const res = await fetch('/entrar');
    const datos = await res.json();
    
    MI_IDENTIFICADOR = datos.idJugador;
    MI_SALA = datos.idSala;

    document.getElementById('mi-id').innerText = MI_IDENTIFICADOR;
    document.getElementById('inicio').style.display = 'none';
    document.getElementById('juego').style.display = 'block';

    // Empezar a preguntar al servidor
    INTERVALO = setInterval(actualizarEstado, intervaloPoll);
}

async function actualizarEstado() {
    const res = await fetch(`/ver-estado/${MI_IDENTIFICADOR}`);
    const datos = await res.json();

    // CLAVE: Si el servidor dice que ya tenemos sala, la guardamos
    if (datos.idSala) {
        MI_SALA = datos.idSala;
    }

    if (datos.estado === "JUGANDO") {
        document.getElementById('info').innerText = "¡Rival encontrado! Elige:";
        // Solo mostramos controles si no hemos jugado aún
        if (!datos.elecciones[MI_IDENTIFICADOR]) {
            document.getElementById('controles').style.display = 'block';
        } else {
            document.getElementById('controles').style.display = 'none';
            document.getElementById('info').innerText = "Esperando al rival...";
        }
    }

    if (datos.estado === "FINALIZADO") {
        clearInterval(INTERVALO); // polling importante hace que finalice
        mostrarResultado(datos.elecciones, datos.jugadores);
    }
}

async function jugar(opcion) {
    // Desaparecer botones al instante
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

    if (miMovimiento === rivalMovimiento) {
        texto += " ¡Empate!";
    } else if (
        (miMovimiento === 'piedra' && rivalMovimiento === 'tijera') ||
        (miMovimiento === 'papel' && rivalMovimiento === 'piedra') ||
        (miMovimiento === 'tijera' && rivalMovimiento === 'papel')
    ) {
        texto += " ¡GANASTE!";
    } else {
        texto += " PERDISTE";
    }

    document.getElementById('info').innerHTML = `<h2>${texto}</h2><button onclick="location.reload()">Reiniciar</button>`;
}
