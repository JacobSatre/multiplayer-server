import express from "express";
import { WebSocket, WebSocketServer } from "ws";
import { v4 as uuid } from "uuid";
import {
  Message,
  MouseMoveInputMessage,
  MoveInputMessage,
  State,
  User,
} from "./types";

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "localhost";

const server = express()
  .use((req, res) => res.send("server is responding!"))
  .listen(port, host, () => console.log(`Listening on ${host} ${port}`));

const wss = new WebSocketServer({ server });

const playerWidth = 20;
const playerHeight = 20;

let state: State = {
  users: {},
  entities: {},
  environment: {
    width: 3840,
    height: 3840,
  },
};

function handleMove(user: User) {
  console.log(user.direction);
  const direction = user.direction;
  const coordinates = state.users[user.id].coordinates;
  const speed = 40;

  const maxHeight = state.environment.height - playerWidth;
  const maxWidth = state.environment.width - playerHeight;

  function moveUp() {
    coordinates.y = coordinates.y - speed < 0 ? 0 : coordinates.y - speed;
  }

  function moveDown() {
    coordinates.y =
      coordinates.y + speed > maxHeight ? maxHeight : coordinates.y + speed;
  }

  function moveLeft() {
    coordinates.x = coordinates.x - speed < 0 ? 0 : coordinates.x - speed;
  }

  function moveRight() {
    coordinates.x =
      coordinates.x + speed > maxWidth ? maxWidth : coordinates.x + speed;
  }

  switch (direction) {
    case "up":
      moveUp();
      break;
    case "down":
      moveDown();
      break;
    case "right":
      moveRight();
      break;
    case "left":
      moveLeft();
      break;
    case "up-right":
      moveUp();
      moveRight();
      break;
    case "up-left":
      moveUp();
      moveLeft();
      break;
    case "down-right":
      moveDown();
      moveRight();
      break;
    case "down-left":
      moveDown();
      moveLeft();
      break;
  }
}

//game clock
setInterval(() => {
  if (state.users) {
    Object.values(state.users).forEach((user) => {
      handleMove(user);
    });
  }
}, 60);

wss.clients;

function handleMoveInput(id: string, message: MoveInputMessage) {
  state.users[id].direction = message.direction;
}

function handleMouseMoveInput(id: string, message: MouseMoveInputMessage) {
  state.users[id].mouseCoordinates = message.coordinates;
}

function handleShootInput(id: string) {
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

function startClock(ws: WebSocket, id: string) {
  return setInterval(() => {
    if (ws && state) {
      const packet = {
        me: state.users[id],
        users: Object.values(state.users).filter((user) => user.id !== id),
        entities: Object.values(state.entities),
        environment: state.environment,
      };
      ws.send(JSON.stringify(packet));
    }
  }, 50);
}

wss.on("connection", (ws: WebSocket) => {
  let id = uuid();
  let color = "#" + Math.floor(Math.random() * 16777215).toString(16);
  state.users[id] = {
    id,
    color,
    coordinates: { x: 0, y: 0 },
    mouseCoordinates: { x: 0, y: 0 },
    direction: "none",
  };

  let interval = startClock(ws, id);

  ws.on("close", () => {
    delete state.users[id];
    clearInterval(interval);
  });
  ws.on("message", (event) => {
    const message: Message = JSON.parse(event.toString());

    if (message.type === "move") {
      handleMoveInput(id, message);
    } else if (message.type === "mousemove") {
      handleMouseMoveInput(id, message);
    } else if (message.type === "shoot") {
      handleShootInput(id);
    }
  });
});

let test = {
  type: "move",
  direction: "none",
  mouseCoordinates: { x: 0, y: 0 },
};
