import * as LA from 'gl-matrix'
import { MonoTypeOperatorFunction, distinctUntilChanged } from 'rxjs'
import { PlaneAxis, PerAxis, PlaneVector, PlaneRect, PlaneLineSegment, PlaneTransformation } from "../type/plane"
import { vectorAdd, vectorSubtract } from "./math"
import { enumMapFactory } from "./object"

export function axisInverted(
    axis: PlaneAxis
): PlaneAxis {
    return axis === PlaneAxis.X ? PlaneAxis.Y : PlaneAxis.X
}
export const fromAxis: <T>(mapper: (v: PlaneAxis) => T) => PerAxis<T> = enumMapFactory(PlaneAxis)
export function planeVectorZeros(): PlaneVector {
    return [0, 0]
}
export function planeRectZeros(): PlaneRect {
    return [[0, 0], [0, 0]]
}
export function planeVectorAligned(
    axis: PlaneAxis,
    position: number,
): PlaneVector {
    return axis === PlaneAxis.X ? [position, 0] : [0, position]
}
export function planeRectAligned(
    size: PlaneVector,
): PlaneRect {
    return [[0, 0], size]
}
export function planeRectDiagonal(
    [position, size]: PlaneRect
): PlaneLineSegment {
    return [position, vectorAdd(position, size)]
}
export function planeVectorTransform(
    trans: Readonly<PlaneTransformation>,
    vec: PlaneVector,
): PlaneVector {
    return LA.vec2.transformMat3([0, 0], vec, trans) as PlaneVector
}
export function planeRectTransform(
    trans: Readonly<PlaneTransformation>,
    rect: PlaneRect,
): PlaneRect {
    const [pos, oppos] = planeRectDiagonal(rect)
    const position = planeVectorTransform(trans, pos)
    const size = vectorSubtract(planeVectorTransform(trans, oppos), position)
    return [position, size]
}
export function distinctPlaneVector(): MonoTypeOperatorFunction<PlaneVector> {
    return distinctUntilChanged<PlaneVector>(([prevX, prevY], [x, y]) =>
        prevX === x && prevY === y)
}

export const threePointsCCW: (p0: PlaneVector, p1: PlaneVector, p2: PlaneVector) => boolean
    = ([ax, ay], [bx, by], [cx, cy]) =>
        (cy - ay) * (bx - ax) > (by - ay) * (cx - ax)

export const twoSegmentsIntersect: (s0: PlaneLineSegment, s1: PlaneLineSegment) => boolean
    = ([a, b], [c, d]) =>
        threePointsCCW(a, c, d) != threePointsCCW(b, c, d) && threePointsCCW(a, b, c) != threePointsCCW(a, b, d)

export function segmentIntersectPath(s: PlaneLineSegment, p: PlaneVector[]): number {
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
