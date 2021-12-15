import { EnumRecord } from "../type/object"
import { arrayFilterIn } from "./collection"

function parseKey(k: string): string | number {
    const res = Number(k)
    return (isNaN(res) ? k : res)
}

export function propertiesPick<T extends Object, F extends (keyof T)[]>(
    obj: T,
    keys: F,
): Pick<T, F[number]> {
    const keySet = new Set<F[number]>(keys)
    return Object.fromEntries(
        arrayFilterIn(Object.keys(obj) as (keyof T)[], keySet)
            .map(k => [k, obj[k]])
    ) as Pick<T, F[number]>
}
export function propertiesOmit<T, K extends keyof T>(
    obj: T,
    ...keys: K[]
): Omit<T, K> {
    const omittedKeys = new Set(keys)
    return Object.fromEntries(
        Object.entries(obj).filter(([k]) => !omittedKeys.has(parseKey(k) as K))
    ) as Omit<T, K>
}
export function propertiesFilter<T>(
    obj: T,
    predicate: (k: string, v: T[keyof T]) => boolean,
): Partial<T> {
    return Object.fromEntries(
        Object.entries(obj).filter(([k, v]) => predicate(k, v))
    ) as Partial<T>
}
export function propertiesSame<T extends {}, K extends keyof T>(
    obj0: T,
    obj1: Pick<T, K>,
    keys: K[],
    comparator = (obj0: T[K], obj1: T[K]) => obj0 === obj1
): K[] {
    return keys.filter(k => comparator(obj0[k], obj1[k]))
}
export function propertiesDiff<T extends {}, K extends keyof T>(
    obj0: T,
    obj1: Pick<T, K>,
    keys: K[],
    comparator = (obj0: T[K], obj1: T[K]) => obj0 === obj1
): K[] {
    return keys.filter(k => !comparator(obj0[k], obj1[k]))
}
export function propertiesSomeSame<T extends {}, K extends keyof T>(
    obj0: T,
    obj1: Pick<T, K>,
    keys: K[],
    comparator = (obj0: T[K], obj1: T[K]) => obj0 === obj1
): boolean {
    return keys.some(k => comparator(obj0[k], obj1[k]))
}

export function propertiesSomeDiff<T extends {}, K extends keyof T>(
    obj0: T,
    obj1: Pick<T, K>,
    keys: K[],
    comparator = (obj0: T[K], obj1: T[K]) => obj0 === obj1
): boolean {
    return keys.some(k => !comparator(obj0[k], obj1[k]))
}

export type ObjectUpdateActions<T extends Object, F extends keyof T> = [(obj: T) => void, ...F[]][]
export function objectUpdateWithActions<T extends D, D>(
    obj: T,
    update: D,
    actions: ObjectUpdateActions<T, keyof Partial<D>>,
): void {
    const active = actions
        .filter(([_, ...keys]) => propertiesSomeDiff<D, keyof D>(obj, update, keys))
        .map(([action]) => action)
    Object.assign(obj, update)
    active.forEach(action => action(obj))
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
        propertiesFilter(e, k => isNaN(Number(k))),
        k => [e[k as keyof E], mapper(e[k as keyof E])],
    )
}
