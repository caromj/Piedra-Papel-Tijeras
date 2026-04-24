import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';


const app = express();
const server = createServer(app);
const io = new Server(server);

  const __dirname = dirname(fileURLToPath(import.meta.url));

  app.get('/', (req, res) => { 
    res.sendFile(join(__dirname, 'index.html'));
  });



io.on('connection', (socket) => {
  console.log("Jugador conectado:", socket.id);

  // Ejemplo simple de chat
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
});

const PORT = 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://TU_IP_LOCAL:${PORT}`);
});