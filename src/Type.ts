
type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N ? R : _TupleOf<T, N, [T, ...R]>
export type TupleOf<T, N extends number> = N extends N ? number extends N ? T[] : _TupleOf<T, N, []> : never
export type MatrixOf<T extends any, R extends number, C extends number> = TupleOf<TupleOf<T, C>, R>
export type NumTuple<N extends number> = TupleOf<number, N>
export type NumMatrix<R extends number, C extends number> = MatrixOf<number, R, C>

export type PlaneVector = [number, number]
export type PlaneSize = [number, number]
export type PlaneRect = [PlaneVector, PlaneSize]
export type PlaneSegment = [PlaneVector, PlaneVector]
export type Viewport = {
    position: PlaneVector
    scale: number
}
export type ViewportUpdate = {
    viewport: Viewport
    animated: boolean
}

export type BlockState = {
    namespace: string
    id: string
    args?: { [key: string]: string }
}

export enum MapMarkingMode {
    Point,
    Path,
    Rect,
    Polygon,
    Ellipse,
}

export enum EventButtonType {
    None = -1,
    Main = 0,
    Auxiliary = 1,
    Secondary = 2,
    Fourth = 3,
    Fifth = 4,
}
