import { InteractionEvent, Point } from "pixi.js";
import { PlaneVector } from "../Type";

export const pointToVector: (p: Point) => PlaneVector
    = p => [p.x, p.y]

export const eventToGlobalPosition: (e: InteractionEvent) => PlaneVector
    = ({ data: { global: { x, y } } }) => [x, y]

export const eventToTargetRelativePosition: (e: InteractionEvent) => PlaneVector
    = ({ currentTarget: { position: { x, y } } }) => [x, y]
