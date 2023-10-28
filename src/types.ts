export type MoveDirection =
  | "up"
  | "down"
  | "left"
  | "right"
  | "up-right"
  | "up-left"
  | "down-right"
  | "down-left"
  | "none";

export type MoveInputMessage = {
  type: "move";
  direction: MoveDirection;
};

export type MouseMoveInputMessage = {
  type: "mousemove";
  coordinates: Coordinates;
};

export type ShootInputMessage = {
  type: "shoot";
};

export type Message =
  | MoveInputMessage
  | MouseMoveInputMessage
  | ShootInputMessage;

export type Coordinates = {
  x: number;
  y: number;
};

export type User = {
  id: string;
  direction: MoveDirection;
  coordinates: Coordinates;
  mouseCoordinates: Coordinates;
  color: string;
};

export type Entity = {
  id: string;
  coordinates: Coordinates;
  color: string;
};

export type Environment = {
  width: 3840;
  height: 3840;
};

export type State = {
  users: {
    [key: string]: User;
  };
  entities: {
    [key: string]: Entity;
  };
  environment: Environment;
};
