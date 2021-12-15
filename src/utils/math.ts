import { NumTuple } from "../type/collection"
import { tupleInitWith } from "./collection"

export function bytesToNumber(bytes: Uint8Array, offset: number, length: number): number {
    let res = 0
    for (let i = 0; i < length; i++)
        res += bytes[offset + i] << 8 * i
    return res
}
export function numberToBytes(value: number, bytes: Uint8Array, offset: number, length: number): void {
    for (let i = 0; i < length; i++)
        bytes[offset + i] = (value >> 8 * i) & 0b1111_1111
}

export function nearestSmallerPowerOf2(n: number): number {
    return 2 << (31 - Math.clz32(n))
}
export function twoNumbersSameSign(n0: number, n1: number): boolean {
    return n0 > 0 && n1 > 0 || n0 < 0 && n1 < 0
}
export function numberBounded(lower: number, upper: number, n: number): number {
    return Math.max(lower, Math.min(upper, n))
}

//#region fn() -> vec
export function vectorZeros<L extends number>(length: L): NumTuple<L> {
    return tupleInitWith(length, 0)
}
export function vectorOnes<L extends number>(length: L): NumTuple<L> {
    return tupleInitWith(length, 1)
}
//#region 

//#region fn(vec)
export function vectorNorm<V extends number[]>(v0: V): number {
    return vectorDist(v0, vectorZeros(v0.length))
}
export function vectorFlip<V extends number[]>(vector: V): V {
    return [...vector].reverse() as V
}
export function vectorRound<V extends number[]>(vector: V): V {
    return vector.map(Math.round) as V
}
export function vectorAbs<V extends number[]>(vector: V): V {
    return vector.map(Math.abs) as V
}
export function vectorBounded<V extends number[]>(lower: number, upper: number, vector: V): V {
    return vector.map(v => numberBounded(lower, upper, v)) as V
}
//#endregion

//#region fn(vec, vec)
export function vectorDist<V extends number[]>(v0: V, v1: V): number {
    return Math.sqrt(v0.reduce((sum, n, idx) => sum + Math.pow(n - v1[idx], 2), 0))
}
export function vectorAdd<V extends number[]>(v0: V, ...vectors: V[]): V {
    return vectors.reduce((sum, v) => v.map((n, i) => sum[i] + n) as V, v0)
}
export function vectorAddInverse<V extends number[]>(vector: V): V {
    return vector.map(v => -v) as V
}
export function vectorSubtract<V extends number[]>(v0: V, ...vectors: V[]): V {
    return vectors.reduce((res, v) => v.map((n, i) => res[i] - n) as V, v0)
}
export function vectorPairwiseMultiply<V extends number[]>(v0: V, v1: V): V {
    return v0.map((n, i) => n * v1[i]) as V
}
export function vectorPairwiseDivide<V extends number[]>(v0: V, v1: V): V {
    return v0.map((n, i) => n / v1[i]) as V
}
export function vectorDotMultiply<V extends number[]>(v0: V, v1: V): number {
    return v0.reduce((sum, n, i) => sum + n * v1[i], 0)
}
//#endregion

//#region fn(scalar, vec)
export function vectorAddScalar<V extends number[]>(scalar: number, vector: V): V {
    return vector.map(n => n + scalar) as V
}
export function vectorSubtractScalar<V extends number[]>(scalar: number, vector: V): V {
    return vector.map(n => n - scalar) as V
}
export function vectorScale<V extends number[]>(scalar: number, vector: V): V {
    return vector.map(n => n * scalar) as V
}
export function vectorInverseScale<V extends number[]>(scalar: number, vector: V): V {
    return vector.map(n => n / scalar) as V
}
export function vectorMean<V extends number[]>(v0: V, v1: V, ...vectors: V[]): V {
    return vectorInverseScale(vectors.length + 2, vectors.reduce((acc, v) => vectorAdd(acc, v), vectorAdd(v0, v1)))
}
//#endregion
