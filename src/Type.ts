export type KeyofWithType<T, U> = {
    [P in keyof T]: T[P] extends U ? P : never
}[keyof T]
export type ZeroToNine = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N ? R : _TupleOf<T, N, [T, ...R]>
export type TupleOf<T, N extends number> = N extends N ? number extends N ? T[] : _TupleOf<T, N, []> : never
export type MatrixOf<T extends any, R extends number, C extends number> = TupleOf<TupleOf<T, C>, R>
export type NumTuple<N extends number> = TupleOf<number, N>
export type NumMatrix<R extends number, C extends number> = MatrixOf<number, R, C>

export type PlaneVector = [number, number]
export type PlaneSize = [number, number]
export type PlaneRect = [PlaneVector, PlaneSize]
export type PlaneSegment = [PlaneVector, PlaneVector]
export enum PlaneAxis {
    X = 0,
    Y = 1,
}
export type Viewport = {
    position: PlaneVector
    scale: number
}
// export type ViewportUpdate = {
//     viewport: Viewport
//     animation?: AnimationOptions
// }
export type SizedViewport = {
    size: PlaneVector,
    viewport: Viewport,
}

export interface AnimationOptions {
    duration: number,
}

export enum MapControlMode {
    Explore,
    Marking,
    Uploads,
}

export enum MapMarkingMode {
    Point,
    Path,
    Rect,
    Polygon,
    Ellipse,
}

export enum MapMarkingStage {
    Drawing,
    Specifying,
}

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
