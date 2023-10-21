import express from "express";
import { WebSocket, WebSocketServer } from "ws";
import { v4 as uuid } from "uuid";
import { Message, MoveMessage, State } from "./types";

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "localhost";

const server = express()
  .use((req, res) => res.send("server is responding!"))
  .listen(port, host, () => console.log(`Listening on ${host} ${port}`));

const wss = new WebSocketServer({ server });

let state: State = {
  users: {},
  entities: {},
};

wss.clients;

function handleMove(id: string, message: MoveMessage) {
  const direction = message.direction;
  const mouseCoordinates = message.mouseCoordinates;
  const speed = 40;

  state.users[id].mouseCoordinates = mouseCoordinates;

  switch (direction) {
    case "up":
      state.users[id].coordinates.y -= speed;
      break;
    case "down":
      state.users[id].coordinates.y += speed;
      break;
    case "right":
      state.users[id].coordinates.x += speed;
      break;
    case "left":
      state.users[id].coordinates.x -= speed;
      break;
    case "up-right":
      state.users[id].coordinates.y -= speed;
      state.users[id].coordinates.x += speed;
      break;
    case "up-left":
      state.users[id].coordinates.y -= speed;
      state.users[id].coordinates.x -= speed;
      break;
    case "down-right":
      state.users[id].coordinates.y += speed;
      state.users[id].coordinates.x += speed;
      break;
    case "down-left":
      state.users[id].coordinates.y += speed;
      state.users[id].coordinates.x -= speed;
      break;
  }
}

function handleShoot(id: string) {
  const userCoordinates = state.users[id].coordinates;
  const userMouseCoordinates = state.users[id].mouseCoordinates;
  const userColor = state.users[id].color;
  const speed = 50;

  let dy = userCoordinates.y - userMouseCoordinates.y;
  let dx = -userCoordinates.x + userMouseCoordinates.x;

  let angle = Math.atan(dy / dx);

  if (dx < 0 && dy < 0) {
    angle += Math.PI;
  }

  if (dx < 0 && dy > 0) {
    angle += Math.PI;
  }

  /*if (dx < 0 && dy > 0) {
    angle += Math.PI / 2; // add 90
  }

  if (dx < 0 && dy < 0) {
    angle += Math.PI; // add 180
  }

  if (dx > 0 && dy < 0) {
    angle += (3 * Math.PI) / 2; // 270
  }*/

  function radians_to_degrees(radians: number) {
    var pi = Math.PI;
    return radians * (180 / pi);
  }

  console.log(`dy = ${dy}, dx = ${dx}. degrees: ${radians_to_degrees(angle)}`);

  let entityId = uuid();

  state.entities[entityId] = {
    id: entityId,
    coordinates: { x: userCoordinates.x, y: userCoordinates.y },
    color: userColor,
  };

  const interval = setInterval(() => {
    state.entities[entityId].coordinates.x += Math.cos(angle) * speed;
    state.entities[entityId].coordinates.y -= Math.sin(angle) * speed;
  }, 60);

  setTimeout(() => {
    clearInterval(interval);
    delete state.entities[entityId];
  }, 3000);
}

wss.on("connection", (ws: WebSocket) => {
  let id = uuid();
  let color = "#" + Math.floor(Math.random() * 16777215).toString(16);
  state.users[id] = {
    id,
    color,
    coordinates: { x: 0, y: 0 },
    mouseCoordinates: { x: 0, y: 0 },
  };

  ws.on("close", () => {
    delete state.users[id];
  });
  ws.on("message", (event) => {
    const message: Message = JSON.parse(event.toString());

    if (message.type === "move") {
      handleMove(id, message);
    } else if (message.type === "shoot") {
      handleShoot(id);
    }
  });
});

let test = {
  type: "move",
  direction: "none",
  mouseCoordinates: { x: 0, y: 0 },
};

setInterval(() => {
  if (wss.clients.size && state) {
    wss.clients.forEach((client) => {
      const packet = {
        users: JSON.stringify(Object.values(state.users)),
        entities: JSON.stringify(Object.values(state.entities)),
      };
      client.send(
        JSON.stringify({
          users: Object.values(state.users),
          entities: Object.values(state.entities),
        })
      );
    });
  }
}, 60);
