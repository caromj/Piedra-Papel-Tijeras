let MI_IDENTIFICADOR = null;
let MI_SALA = null;
let fuenteEventos = null;

async function empezar() {
    // 1. Abrir SSE primero
    iniciarSSE();

    // 2. Luego entrar en la cola
    const res = await fetch('/entrar');
    const datos = await res.json();

    MI_IDENTIFICADOR = datos.idJugador;
    MI_SALA = datos.idSala;

    document.getElementById('mi-id').innerText = MI_IDENTIFICADOR;
    document.getElementById('inicio').style.display = 'none';
    document.getElementById('juego').style.display = 'block';
}

function iniciarSSE() {
    // OJO: aquí aún no sabemos MI_IDENTIFICADOR, así que usamos un query vacío
    // y luego reasignamos cuando lo tengamos
    const tempId = Math.random().toString(36).slice(2);
    fuenteEventos = new EventSource(`/eventos?idJugador=${tempId}`);

    // Cuando llegue /entrar, el servidor usará otro idJugador,
    // así que mejor hacemos esto: cerramos y reabrimos con el ID real
    fuenteEventos.onopen = () => {
        // Nada especial aquí
    };

    // Reasignaremos el EventSource después de /entrar si hace falta
}

// Mejor: reabrir SSE con el ID real después de /entrar
async function empezar() {
    const res = await fetch('/entrar');
    const datos = await res.json();

    MI_IDENTIFICADOR = datos.idJugador;
    MI_SALA = datos.idSala;

    document.getElementById('mi-id').innerText = MI_IDENTIFICADOR;
    document.getElementById('inicio').style.display = 'none';
    document.getElementById('juego').style.display = 'block';

    // Abrimos SSE con el ID REAL
    fuenteEventos = new EventSource(`/eventos?idJugador=${MI_IDENTIFICADOR}`);

    fuenteEventos.addEventListener("rival-encontrado", e => {
        const data = JSON.parse(e.data);
        MI_SALA = data.idSala;

        document.getElementById('info').innerText = "¡Rival encontrado! Elige:";
        document.getElementById('controles').style.display = 'block';
    });

    fuenteEventos.addEventListener("rival-jugo", () => {
        document.getElementById('info').innerText = "El rival ya jugó...";
    });

    fuenteEventos.addEventListener("finalizado", e => {
        const data = JSON.parse(e.data);
        mostrarResultado(data.elecciones, data.jugadores);
        fuenteEventos.close();
    });
}

async function jugar(opcion) {
    document.getElementById('controles').style.display = 'none';
    document.getElementById('info').innerText = "Enviando jugada...";

    await fetch('/enviar-jugada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

    document.getElementById('info').innerHTML =
        `<h2>${texto}</h2><button onclick="location.reload()">Reiniciar</button>`;
}

