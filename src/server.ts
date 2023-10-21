import express from "express";
import { WebSocket, WebSocketServer } from "ws";
import { v4 as uuid } from "uuid";

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "localhost";

const server = express()
  .use((req, res) => res.send("server is responding!"))
  .listen(port, host, () => console.log(`Listening on ${host} ${port}`));

type Coordinates = {
  x: number;
  y: number;
};

type User = {
  id: string;
  coordinates: Coordinates;
  color: string;
};

type State = {
  [key: string]: User;
};

const wss = new WebSocketServer({ server });

let state: State = {};

wss.clients;

wss.on("connection", (ws: WebSocket & { id: string }) => {
  let id = uuid();
  let color = "#" + Math.floor(Math.random() * 16777215).toString(16);
  state[id] = { id, color, coordinates: { x: 0, y: 0 } };

  ws.on("close", () => {
    delete state[id];
  });
  ws.on("message", (event) => {
    const message = JSON.parse(event.toString());

    state[id].coordinates = message.coordinates;
  });
});

setInterval(() => {
  if (wss.clients.size && state) {
    wss.clients.forEach((client) => {
      client.send(JSON.stringify(Object.values(state)));
    });
  }
}, 5);
