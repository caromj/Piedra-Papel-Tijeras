import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';


const app = express(); // crea un servidor web normal 
const server = createServer(app); // convierte ese servidor a un servidor HTTP
const io = new Server(server); // Añade Socket.IO encima del servidor HTTP

  const __dirname = dirname(fileURLToPath(import.meta.url));

// Servir archivos  desde /public
app.use(express.static(join(__dirname, 'public')));

// Ruta principal: envía index.html
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});



io.on('connection', (socket) => { // cada vez que alguien se conecta le da un socket (id) único 
  console.log("Jugador conectado:", socket.id);

  // Ejemplo de que el elije el jugador
  socket.on('jugada', (eleccion) => { //el cliente envia un mensaje, el servidor lo recibe y lo reenvia a todos los clientes conectados
    io.emit('mensaje', `Jugador ${socket.id} ha elegido ${eleccion}`); //envia el mensaje a todos los mensajes conectados
  }); 
});

const PORT = 3000;

server.listen(PORT, "0.0.0.0", () => { // esto hace que el servido escuche todas las ip 
  console.log(`Servidor corriendo en http://192.168.139.42:${PORT}`);
});
