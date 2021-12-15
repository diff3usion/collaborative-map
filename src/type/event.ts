import { TupleOf } from "./collection"
import { PlaneVector } from "./plane"

export enum PointerEventType {
    Move,
    Down,
    Up,
    Enter,
    Leave,
    Over,
    Out,
}

export enum EventButtonType {
    None = -1,
    Main = 0,
    Auxiliary = 1,
    Secondary = 2,
    Fourth = 3,
    Fifth = 4,
}

export enum EventButtonsBit {
    None = 0,
    Left = 1 << 0,
    Right = 1 << 1,
    Middle = 1 << 2,
    Fourth = 1 << 3,
    Fifth = 1 << 4,
}

export type GestureEvent<T extends number> = TupleOf<PointerEvent, T>
export type GesturePosition<T extends number> = TupleOf<PlaneVector, T>
export type GesturePositionPair<T extends number> = [GesturePosition<T>, GesturePosition<T>]
