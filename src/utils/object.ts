import { EnumRecord, PlaneAxis, PerAxis } from "../Type"
import { arrayFilterIn } from "./collection"


export function pickProperties<T extends Object, F extends (keyof T)[]>(
    obj: T,
    keys: F,
): Pick<T, F[number]> {
    const keySet = new Set<F[number]>(keys)
    return Object.fromEntries(
        arrayFilterIn(Object.keys(obj) as (keyof T)[], keySet)
            .map(k => [k, obj[k]])
    ) as Pick<T, F[number]>
}
export function filterProperties<T>(
    obj: T,
    predicate: (k: string, v: T[keyof T]) => boolean
): Partial<T> {
    return Object.fromEntries(
        Object.entries(obj).filter(([k, v]) => predicate(k, v))
    ) as Partial<T>
}
export function sameProperties<T extends Object, F extends keyof T>(
    obj0: T,
    obj1: T,
    keys: F[],
    comparator = (obj0: T[F], obj1: T[F]) => obj0 === obj1
): F[] {
    return keys.filter(k => comparator(obj0[k], obj1[k]))
}
export function diffProperties<T extends Object, F extends keyof T>(
    obj0: T,
    obj1: T,
    keys: F[],
    comparator = (obj0: T[F], obj1: T[F]) => obj0 === obj1
): F[] {
    return keys.filter(k => !comparator(obj0[k], obj1[k]))
}
export function someSameProperties<T extends Object, F extends keyof T>(
    obj0: T,
    obj1: T,
    keys: F[],
    comparator = (obj0: T[F], obj1: T[F]) => obj0 === obj1
): boolean {
    return keys.some(k => comparator(obj0[k], obj1[k]))
}
export function someDiffProperties<T extends Object, F extends keyof T>(
    obj0: T,
    obj1: T,
    keys: F[],
    comparator = (obj0: T[F], obj1: T[F]) => obj0 === obj1
): boolean {
    return keys.some(k => !comparator(obj0[k], obj1[k]))
}

type BinaryOperator<T> = (op0: T, op1: T) => T
type BinaryOperatorWithArgs<T, A extends any[]> = (op0: T, op1: T, ...args: A) => T
export const binaryOperator: <T extends Object>(
    fns: { [K in keyof T]: BinaryOperator<T[K]> },
) => BinaryOperator<T> = binaryOperatorWithArgs
export function binaryOperatorWithArgs<T extends Object, A extends any[]>(
    fns: { [K in keyof T]: BinaryOperatorWithArgs<T[K], A> },
): BinaryOperatorWithArgs<T, A> {
    return (op0: T, op1: T, ...args: A) =>
        (Object.keys(op0) as (keyof T)[]).reduce((obj: T, k: keyof T) => {
            obj[k] = fns[k](op0[k], op1[k], ...args)
            return obj
        }, { ...op0 })
}

function parseKey(k: string): string | number {
    const res = Number(k)
    return (isNaN(res) ? k : res)
}
export function recordMap<T extends string | number, F, K extends string | number, V>(
    record: Record<T, F>,
    mapper: (k: T, v: F) => [K, V],
): Record<K, V> {
    return Object.fromEntries(
        Object.keys(record)
            .map(t => parseKey(t) as T)
            .map(t => mapper(t, record[t]) as [K, V])
    ) as Record<K, V>
}
export function enumMapFactory<E extends EnumRecord<E>>(
    e: E,
): <T>(mapper: (v: E[keyof E]) => T) => Record<E[keyof E], T> {
    return mapper => recordMap(
        filterProperties(e, k => isNaN(Number(k))),
        k => [e[k as keyof E], mapper(e[k as keyof E])],
    )
}
export const fromAxis: <T>(mapper: (v: PlaneAxis) => T) => PerAxis<T> = enumMapFactory(PlaneAxis)
