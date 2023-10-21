export type MoveDirections =
  | "up"
  | "down"
  | "left"
  | "right"
  | "up-right"
  | "up-left"
  | "down-right"
  | "down-left"
  | "none";

export type MoveMessage = {
  type: "move";
  direction: MoveDirections;
  mouseCoordinates: Coordinates;
};

export type ShootMessage = {
  type: "shoot";
};

export type Message = MoveMessage | ShootMessage;

export type Coordinates = {
  x: number;
  y: number;
};

export type User = {
  id: string;
  coordinates: Coordinates;
  mouseCoordinates: Coordinates;
  color: string;
};

export type Entity = {
  id: string;
  coordinates: Coordinates;
  color: string;
};

export type State = {
  users: {
    [key: string]: User;
  };
  entities: {
    [key: string]: Entity;
  };
};
