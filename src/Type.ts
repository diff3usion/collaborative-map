//#region Property Naming
export type SnakeToCamelCase<S extends string> = S extends `${infer T}_${infer U}`
    ? `${T}${Capitalize<SnakeToCamelCase<U>>}`
    : S
export type CamelToSnakeCase<S extends string> = S extends `${infer T}${infer U}`
    ? `${T extends Capitalize<T> ? "_" : ""}${Lowercase<T>}${CamelToSnakeCase<U>}`
    : S
export type PickWithPrefix<Prefix extends string, T, K extends keyof T> = {
    [P in K & string as `${Prefix}${Capitalize<P>}`]: T[P]
}
export type PickWithSuffix<Suffix extends string, T, K extends keyof T> = {
    [P in K & string as `${P}${Capitalize<Suffix>}`]: T[P]
}
export type PickAndRename<T, K extends Record<keyof T, string>> = {
    [P in keyof K as K[P]]: P extends keyof T ? T[P] : never
}
export type RenameWithPrefix<Prefix extends string, T, K extends keyof T> = Omit<T, K> & PickWithPrefix<Prefix, T, K>
export type RenameWithSuffix<Suffix extends string, T, K extends keyof T> = Omit<T, K> & PickWithSuffix<Suffix, T, K>
export type Rename<T, K extends Record<keyof T, string>> = Omit<T, keyof K> & PickAndRename<T, K>
//#endregion

//#region Object Related
export type Overwrite<T, F> = Omit<T, keyof F> & F
export type EnumRecord<E> = Record<keyof E, E[keyof E]>
export type KeyofWithType<T, U> = {
    [P in keyof T]: T[P] extends U ? P : never
}[keyof T]
//#endregion

//#region Array Related
type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N ? R : _TupleOf<T, N, [T, ...R]>
export type TupleOf<T, N extends number> = N extends N ? number extends N ? T[] : _TupleOf<T, N, []> : never
export type MatrixOf<T extends any, R extends number, C extends number> = TupleOf<TupleOf<T, C>, R>
export type NumTuple<N extends number> = TupleOf<number, N>
export type NumMatrix<R extends number, C extends number> = MatrixOf<number, R, C>
//#endregion

//#region Geometry
export type PlaneVector = [number, number]
export type PlaneSize = [number, number]
export type PlaneRect = [PlaneVector, PlaneSize]
export type PlaneSegment = [PlaneVector, PlaneVector]
export enum PlaneAxis {
    X = 0,
    Y = 1,
}
export type PerAxis<T> = Record<PlaneAxis, T>
export type Viewport = {
    position: PlaneVector
    scale: number
}
export type SizedViewport = {
    size: PlaneSize,
    viewport: Viewport,
}

//#endregion
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
