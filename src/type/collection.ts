type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N ? R : _TupleOf<T, N, [T, ...R]>
export type TupleOf<T, N extends number> = N extends N ? number extends N ? T[] : _TupleOf<T, N, []> : never
export type MatrixOf<T extends any, R extends number, C extends number> = TupleOf<TupleOf<T, C>, R>
export type NumTuple<N extends number> = TupleOf<number, N>
export type NumMatrix<R extends number, C extends number> = MatrixOf<number, R, C>

export type MapDiff<K, V> = {
    addition: Map<K, V>
    deletion: Map<K, V>
    update: Map<K, [V, V]>
}
export type SetDiff<T> = {
    addition: Set<T>
    deletion: Set<T>
}
export type Diff<T extends Map<any, any> | Set<any>>
    = T extends Map<infer K, infer V> ? MapDiff<K, V>
    : T extends Set<infer T> ? SetDiff<T>
    : never
