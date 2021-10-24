type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N ? R : _TupleOf<T, N, [T, ...R]>
export type TupleOf<T, N extends number> = N extends N ? number extends N ? T[] : _TupleOf<T, N, []> : never
export type MatrixOf<T extends any, R extends number, C extends number> = TupleOf<TupleOf<T, C>, R>
export type NumTuple<N extends number> = TupleOf<number, N>
export type NumMatrix<R extends number, C extends number> = MatrixOf<number, R, C>
