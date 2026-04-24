 const socket = io(); // crea la conexion en tiempo real entre navegador y servidor
 //  crea la libreria io y se conecta al mismos hots y puerto de donde cargo

  const messages = document.getElementById('messages');

function addMessage(text) { 
  const li = document.createElement('li');  //guardo el mensaje en la li
  li.textContent = text; //el contenido de esa li lo convierto en texto
  messages.appendChild(li); // añade elemento al final de la lista y mantiene el orden 
  window.scrollTo(0, document.body.scrollHeight); // esto baja automaticamente abarro de la linea vas siempre al ultimo mensaje
}

document.getElementById('Piedra').addEventListener('click', () => {
  socket.emit('jugada', 'Piedra');// es la conexion de tiempoo real creada con io
});

document.getElementById('Papel').addEventListener('click', () => {
  socket.emit('jugada', 'Papel');
});

document.getElementById('Tijeras').addEventListener('click', () => {
  socket.emit('jugada', 'Tijeras');
});

socket.on('mensaje', (txt) => {
  addMessage(txt);
}); // para recibir el mensaje, con emit envio algo al servidor  y con on recibo algo en el servidor