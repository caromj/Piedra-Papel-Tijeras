let MI_IDENTIFICADOR = null;
let MI_SALA = null;
let INTERVALO = null;
const intervaloPoll = 5001;

async function empezar() { // llama al servidor para entrar en el juego
    const res = await fetch('/entrar'); //recibe id jugador, id sala y estado
    const datos = await res.json();
    
    MI_IDENTIFICADOR = datos.idJugador; //guarda tu id y la sala (si ya tienes rival )
    MI_SALA = datos.idSala;

    document.getElementById('mi-id').innerText = MI_IDENTIFICADOR; // muestra tu id 
    document.getElementById('inicio').style.display = 'none';
    document.getElementById('juego').style.display = 'block';

    // Empezar a preguntar al servidor
    INTERVALO = setInterval(actualizarEstado, intervaloPoll);
}

async function actualizarEstado() { //  pregunta al servidor por el estado
    const res = await fetch(`/ver-estado/${MI_IDENTIFICADOR}`);
    const datos = await res.json();

    if (datos.idSala) {  //  Si el servidor dice que ya tenemos sala, la guardamos
        MI_SALA = datos.idSala;
    }

    if (datos.estado === "JUGANDO") {
        document.getElementById('info').innerText = "¡Rival encontrado! Elige:";
        
        // SIEMPRE mostrar controles (ya no se ocultan)
        document.getElementById('controles').style.display = 'block';
        document.getElementById('info').innerText = "¡Rival encontrado! Elige cuando quieras";
    }

    if (datos.estado === "FINALIZADO") {
        clearInterval(INTERVALO); //si la partida termino para el polling y muestra resultado 
        mostrarResultado(datos.elecciones, datos.jugadores);
    }
}

async function jugar(opcion) { 
    // Ya no ocultamos botones ni mostramos "esperando"
    // Solo enviamos la jugada

    await fetch('/enviar-jugada', { // envia tu jugada al servidor
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
            idJugador: MI_IDENTIFICADOR, 
            idSala: MI_SALA, 
            jugada: opcion 
        })
    });

    document.getElementById('info').innerText = "Jugada enviada";
}

function mostrarResultado(elecciones, jugadores) {

    // OCULTAR BOTONES AL MOSTRAR RESULTADO
    document.getElementById('controles').style.display = 'none';

    const rivalID = jugadores.find(id => id !== MI_IDENTIFICADOR); // encuentra el id del rival 
    const miMovimiento = elecciones[MI_IDENTIFICADOR];
    const rivalMovimiento = elecciones[rivalID]; // saca tu jugada y del rival 

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

