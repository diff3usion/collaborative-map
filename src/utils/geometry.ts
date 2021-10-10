import { numberBounded } from "./math"
import { PlaneVector, PlaneSegment, PlaneRect, NumTuple, Viewport, NumMatrix, PlaneSize, MatrixOf, TupleOf, PlaneAxis } from "../Type"
import { initArray, init2dArray, map2dArray } from "./collection"

export const initTuple = initArray as <T, L extends number>(length: L, producer: (index: number) => T) => TupleOf<T, L>
export const initMatrix = init2dArray as <T, R extends number, C extends number>(row: R, col: C, producer: (row: number, col: number) => T) => MatrixOf<T, R, C>
export const mapMatrix = map2dArray as <T, R extends number, C extends number>(m: MatrixOf<T, R, C>, producer: (val: T, row: number, col: number) => T) => MatrixOf<T, R, C>

export function vectorFlip<V extends NumTuple<number>>(vector: V): V {
    return [...vector].reverse() as V
}
export function vectorRound<V extends NumTuple<number>>(vector: V): V {
    return vector.map(Math.round) as V
}
export function vectorAbs<V extends NumTuple<number>>(vector: V): V {
    return vector.map(Math.abs) as V
}
export function vectorBounded<V extends NumTuple<number>>(lower: number, upper: number, vector: V): V {
    return vector.map(v => numberBounded(lower, upper, v)) as V
}
export function vectorPlus<V extends NumTuple<number>>(v0: V, ...vectors: V[]): V {
    return vectors.reduce((sum, v) => v.map((n, i) => sum[i] + n) as V, v0)
}
export function vectorMinus<V extends NumTuple<number>>(v0: V, ...vectors: V[]): V {
    return vectors.reduce((res, v) => v.map((n, i) => res[i] - n) as V, v0)
}
export function vectorAdd<V extends NumTuple<number>>(scaler: number, vector: V): V {
    return vector.map(n => n + scaler) as V
}
export function vectorSubtract<V extends NumTuple<number>>(scaler: number, vector: V): V {
    return vector.map(n => n - scaler) as V
}
export function vectorTimes<V extends NumTuple<number>>(multiplier: number, vector: V): V {
    return vector.map(n => n * multiplier) as V
}
export function vectorDivide<V extends NumTuple<number>>(divisor: number, vector: V): V {
    return vector.map(n => n / divisor) as V
}
export function vectorMean<V extends NumTuple<number>>(v0: V, v1: V, ...vectors: V[]): V {
    return vectorDivide(vectors.length + 2, vectors.reduce((acc, v) => vectorPlus(acc, v), vectorPlus(v0, v1)))
}
export function vectorNorm<V extends NumTuple<number>>(v0: V): number {
    return Math.sqrt(v0.reduce((sum, n) => sum + n * n, 0))
}
export function vectorDist<V extends NumTuple<number>>(v0: V, v1: V): number {
    return Math.sqrt(v0.reduce((sum, n, idx) => sum + Math.pow(n - v1[idx], 2), 0))
}

export const threePointsCCW: (p0: PlaneVector, p1: PlaneVector, p2: PlaneVector) => boolean
    = ([ax, ay], [bx, by], [cx, cy]) =>
        (cy - ay) * (bx - ax) > (by - ay) * (cx - ax)

export const twoSegmentsIntersect: (s0: PlaneSegment, s1: PlaneSegment) => boolean
    = ([a, b], [c, d]) =>
        threePointsCCW(a, c, d) != threePointsCCW(b, c, d) && threePointsCCW(a, b, c) != threePointsCCW(a, b, d)

export function segmentIntersectPath(s: PlaneSegment, p: PlaneVector[]): number {
    for (let i = 0; i < p.length - 1; i++)
        if (twoSegmentsIntersect(s, [p[i], p[i + 1]])) return i
    return -1
}
export function twoPathsIntersect(p0: PlaneVector[], p1: PlaneVector[]): [number, number] {
    for (let i = 0; i < p0.length - 1; i++) {
        const j = segmentIntersectPath([p0[i], p0[i + 1]], p1)
        if (j !== -1) return [i, j]
    }
    return [-1, -1]
}
export function pathSelfIntersect(p: PlaneVector[]): [number, number] {
    for (let i = 0; i < p.length - 1; i++) for (let j = 0; j < p.length - 1; j++)
        if (Math.abs(i - j) > 1 && twoSegmentsIntersect([p[i], p[i + 1]], [p[j], p[j + 1]])) return [i, j]
    return [-1, -1]
}

export const isPointInRect: (p: PlaneVector, r: PlaneRect) => boolean
    = ([px, py], [[rx, ry], [rw, rh]]) =>
        px >= rx && px <= (rx + rw) && py >= ry && py <= (ry + rh)

export const doesTwoRectsOverlap: (r1: PlaneRect, r2: PlaneRect) => boolean
    = ([[x1, y1], [w1, h1]], [[x2, y2], [w2, h2]]) =>
        x1 < x2 + w2 && x1 + w1 > x2 && y1 + h1 > y2 && y1 < y2 + h2

// Shift: input relative to viewport --> output relative to global

export const positionShift: (n: number, orientation: PlaneAxis, viewport: Viewport) => number
    = (n, axis, { position: [x, y], scale }) => scale * n + (axis === PlaneAxis.X ? y : x)

export const positionUnshift: (n: number, orientation: PlaneAxis, viewport: Viewport) => number
    = (n, axis, { position: [x, y], scale }) => (n - (axis === PlaneAxis.X ? y : x)) / scale

export const planeVectorShift: (v: PlaneVector, viewport: Viewport) => PlaneVector
    = (v, { position, scale }) => vectorPlus(vectorTimes(scale, v), position)

export const planeVectorUnshift: (v: PlaneVector, viewport: Viewport) => PlaneVector
    = (v, { position, scale }) => vectorTimes(1 / scale, vectorMinus(v, position))

export const planeVectorsBoundingRect: (vectors: PlaneVector[]) => PlaneRect
    = vectors => {
        const res = vectors.reduce<NumMatrix<2, 2>>((prev, curr) =>
            mapMatrix<number, 2, 2>(prev, (val, row, col) => (row ? Math.max : Math.min)(val, curr[col])),
            [[Number.MAX_VALUE, Number.MAX_VALUE], [-Number.MAX_VALUE, -Number.MAX_VALUE]])
        res[1] = vectorMinus(res[1], res[0])
        res[1] = vectorBounded(1, Infinity, res[1])
        return res
    }

export const scaleWithMovingPoint: (scale: number, from: PlaneVector, to: PlaneVector) => (v: PlaneVector) => PlaneVector
    = (scale, from, to) =>
        v => vectorMinus(to, vectorTimes(scale, vectorMinus(from, v)))

export const scaleWithFixedPoint: (scale: number, fixed: PlaneVector) => (v: PlaneVector) => PlaneVector
    = (scale, fixed) =>
        scaleWithMovingPoint(scale, fixed, fixed)

export const scaleRectWithFixedPoint: (rect: PlaneRect, scale: number, fixed: PlaneVector) => PlaneRect
    = ([position, size], scale, fixed) =>
        [scaleWithFixedPoint(scale, fixed)(position), vectorTimes(scale, size)]

export const scaleRectWithMinSize: (rect: PlaneRect, scale: number, fixed: PlaneVector, min: number) => PlaneRect
    = ([position, size], scale, fixed, min) => {
        if (size[0] * scale < min) scale = min / size[0]
        if (size[1] * scale < min) scale = min / size[1]
        return scaleRectWithFixedPoint([position, size], scale, fixed)
    }

export const divideRectByHalf: (rect: PlaneRect, axis: PlaneAxis) => [PlaneRect, PlaneRect]
    = ([[x, y], [w, h]], axis) =>
        axis === PlaneAxis.X ? [
            [[x, y], [w / 2, h]],
            [[x + w / 2, y], [w / 2, h]],
        ] : [
            [[x, y], [w, h / 2]],
            [[x, y + h / 2], [w, h / 2]],
        ]

export const rectCenter: (rect: PlaneRect) => PlaneVector
    = ([[x, y], [w, h]]) => [x + w / 2, y + h / 2]

export const scaleToFitRectIn: (rect: PlaneRect, size: PlaneSize) => number
    = ([_, [w, h]], [sw, sh]) =>
        Math.min(sw / w, sh / h)
