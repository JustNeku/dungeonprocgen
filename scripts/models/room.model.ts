import { Coords } from "./coords.model"

export type Room = {
    coords: Coords,
    isStart: boolean,
    isLast: boolean
}