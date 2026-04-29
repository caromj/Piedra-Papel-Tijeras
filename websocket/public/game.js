//  Conexión con el servidor
const socket = io("http://192.168.139.42:3003");

socket.on("connect", () => {
  document.getElementById("estado").innerText =
    "Conectado como: " + socket.id;
});

//  Enviar elección al servidor
function enviarEleccion(eleccion) {
  socket.emit("eleccion", eleccion);

  document.getElementById("estado").innerText =
    "Elegiste: " + eleccion + " (esperando al otro jugador)";
}

//  Recibir resultado de la ronda
socket.on("resultado", (datos) => {
  const divResultado = document.getElementById("resultado");

  // Mostrar elecciones
  let texto = `
    Jugador 1 (${datos.jugador1.id}) eligió: ${datos.jugador1.eleccion}<br>
    Jugador 2 (${datos.jugador2.id}) eligió: ${datos.jugador2.eleccion}<br><br>
  `;

  // Determinar si YO soy jugador1 o jugador2
  const soyJugador1 = socket.id === datos.jugador1.id;
  const soyJugador2 = socket.id === datos.jugador2.id;

  // Mensaje personalizado
  if (datos.ganador === "empate") {
    texto += `<span>Habéis empatado</span>`;
  } else {
    const ganadorId = datos[datos.ganador].id;

    if (socket.id === ganadorId) {
      texto += `<span>Has ganado </span>`;
    } else {
      texto += `<span>Has perdido </span>`;
    }
  }

  divResultado.innerHTML = texto;
});
