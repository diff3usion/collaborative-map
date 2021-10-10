export function pickProperties<T extends Object, F extends (keyof T)[]>(
    obj: T,
    keys: F,
): Pick<T, F[number]> {
    return keys.reduce((a, x) => {
        if (obj.hasOwnProperty(x)) a[x] = obj[x]
        return a
    }, {} as Partial<T>) as Pick<T, F[number]>
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
