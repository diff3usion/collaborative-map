import { boundedNumber, mapMatrix } from "."
import { PlaneVector, PlaneSegment, PlaneRect, NumTuple, Viewport, MatrixOf, NumMatrix, PlaneSize } from "../Type"

export const threePointsCCW: (p0: PlaneVector, p1: PlaneVector, p2: PlaneVector) => boolean = ([ax, ay], [bx, by], [cx, cy]) =>
    (cy - ay) * (bx - ax) > (by - ay) * (cx - ax)

export const twoSegmentsIntersect: (s0: PlaneSegment, s1: PlaneSegment) => boolean = ([a, b], [c, d]) =>
    threePointsCCW(a, c, d) != threePointsCCW(b, c, d) && threePointsCCW(a, b, c) != threePointsCCW(a, b, d)

export const segmentIntersectPath: (s: PlaneSegment, p: PlaneVector[]) => number = (s, p) => {
    for (let i = 0; i < p.length - 1; i++)
        if (twoSegmentsIntersect(s, [p[i], p[i + 1]])) return i
    return -1
}

export const twoPathsIntersect: (p0: PlaneVector[], p1: PlaneVector[]) => [number, number] = (p0, p1) => {
    for (let i = 0; i < p0.length - 1; i++) {
        const j = segmentIntersectPath([p0[i], p0[i + 1]], p1)
        if (j !== -1) return [i, j]
    }
    return [-1, -1]
}

export const pathSelfIntersect: (p: PlaneVector[]) => [number, number] = p => {
    for (let i = 0; i < p.length - 1; i++) for (let j = 0; j < p.length - 1; j++)
        if (Math.abs(i - j) > 1 && twoSegmentsIntersect([p[i], p[i + 1]], [p[j], p[j + 1]])) return [i, j]
    return [-1, -1]
}

export const vectorFlip = <V extends NumTuple<number>>(vector: V) =>
    vector.map((_, i) => vector[vector.length - 1 - i]) as V

export const vectorRound = <V extends NumTuple<number>>(vector: V) =>
    vector.map(Math.round) as V

export const vectorAdd = <V extends NumTuple<number>>(...vectors: V[]) =>
    vectors.splice(1).reduce((sum, v) => v.map((n, i) => sum[i] + n) as V, vectors[0])

export const vectorMinus = <V extends NumTuple<number>>(...vectors: V[]) =>
    vectors.splice(1).reduce((res, v) => v.map((n, i) => res[i] - n) as V, vectors[0])

export const vectorAbs = <V extends NumTuple<number>>(vector: V) =>
    vector.map(Math.abs) as V

export const vectorAbsMinus = <V extends NumTuple<number>>(...vectors: V[]) =>
    vectorAbs(vectorMinus(...vectors))

export const vectorTimes = <V extends NumTuple<number>>(multiplier: number, vector: V) =>
    vector.map(n => n * multiplier) as V

export const vectorDist = <V extends NumTuple<number>>(v0: V, v1: V) =>
    Math.sqrt(v0.reduce((sum, n, idx) => sum + Math.pow(n - v1[idx], 2), 0))

export const isPointInRect: (p: PlaneVector, r: PlaneRect) => boolean
    = ([px, py], [[rx, ry], [rw, rh]]) =>
        px >= rx && px <= (rx + rw) && py >= ry && py <= (ry + rh)

export const doesTwoRectsOverlap: (r1: PlaneRect, r2: PlaneRect) => boolean
    = ([[x1, y1], [w1, h1]], [[x2, y2], [w2, h2]]) =>
        x1 < x2 + w2 && x1 + w1 > x2 && y1 + h1 > y2 && y1 < y2 + h2

// Shift: input relative to viewport --> output relative to global

export const numberShift: (n: number, isHorizontal: boolean, viewport: Viewport) => number
    = (n, isHorizontal, { position: [x, y], scale }) => scale * n + (isHorizontal ? y : x)

export const numberUnshift: (n: number, isHorizontal: boolean, viewport: Viewport) => number
    = (n, isHorizontal, { position: [x, y], scale }) => (n - (isHorizontal ? y : x)) / scale

export const planeVectorShift: (v: PlaneVector, viewport: Viewport) => PlaneVector
    = (v, { position, scale }) => vectorAdd(vectorTimes(scale, v), position)

export const planeVectorUnshift: (v: PlaneVector, viewport: Viewport) => PlaneVector
    = (v, { position, scale }) => vectorTimes(1 / scale, vectorMinus(v, position))

export const boundedVector = <V extends NumTuple<number>>(lower: number, upper: number, vector: V) =>
    vector.map(v => boundedNumber(lower, upper, v)) as V

export const planeVectorsFitRect: (vectors: PlaneVector[]) => PlaneRect
    = vectors => {
        const res = vectors.reduce<NumMatrix<2, 2>>((prev, curr) =>
            mapMatrix<number, 2, 2>(prev, (val, row, col) => (row ? Math.max : Math.min)(val, curr[col])),
            [[Number.MAX_VALUE, Number.MAX_VALUE], [-Number.MAX_VALUE, -Number.MAX_VALUE]])
        res[1] = vectorMinus(res[1], res[0])
        res[1] = boundedVector(1, Infinity, res[1])
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

export const divideRectByHalf: (rect: PlaneRect, isHorizontal: boolean) => [PlaneRect, PlaneRect]
    = ([[x, y], [w, h]], isHorizontal) =>
        isHorizontal ? [
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
