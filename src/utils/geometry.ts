import { PlaneVector, PlaneRect, PlaneAxis, PlaneSize } from "../type/plane"
import { Viewport } from '../type/viewport'
import { matrixMap } from "./collection"
import { vectorAdd, vectorBounded, vectorInverseScale, vectorScale, vectorSubtract } from "./math"

// Shift: inputs in terms of stage coordinates --> outputs in terms of canvas coordinates (according to the viewport)

// export function positionShift(
//     n: number,
//     axis: PlaneAxis,
//     { position: [x, y], scale }: Viewport,
// ): number {
//     axis = axis === PlaneAxis.X ? PlaneAxis.Y : PlaneAxis.X
//     const mat = LA.mat3.fromTranslation(LA.mat3.create(), [x, y])
//     LA.mat3.scale(mat, mat, [scale, scale])
//     const res = LA.vec2.transformMat3(LA.vec2.create(), [0, 0].map((v, i) => i === axis ? n : v) as PlaneVector, mat)
//     return res[axis]
//     return scale * n + (axis === PlaneAxis.X ? y : x)
// }
// export function positionUnshift(
//     n: number,
//     axis: PlaneAxis,
//     { position: [x, y], scale }: Viewport,
// ): number {
//     return (n - (axis === PlaneAxis.X ? y : x)) / scale
// }
export function planeVectorShift(
    v: PlaneVector,
    { position, scale }: Viewport,
): PlaneVector {
    return vectorAdd(vectorScale(scale, v), position)
}
export function planeVectorUnshift(
    v: PlaneVector,
    { position, scale }: Viewport,
): PlaneVector {
    return vectorInverseScale(scale, vectorSubtract(v, position))
}
export function planeVectorsBoundingRect(vectors: PlaneVector[]): PlaneRect {
    const res = vectors.reduce<PlaneRect>((prev, curr) =>
        matrixMap<number, 2, 2>(prev, (val, row, col) => (row ? Math.max : Math.min)(val, curr[col])),
        [[Number.MAX_VALUE, Number.MAX_VALUE], [-Number.MAX_VALUE, -Number.MAX_VALUE]])
    res[1] = vectorSubtract(res[1], res[0])
    res[1] = vectorBounded(1, Infinity, res[1])
    return res
}

export function scaleWithMovingPoint(
    scale: number,
    from: PlaneVector,
    to: PlaneVector
): (v: PlaneVector) => PlaneVector {
    return v => vectorSubtract(to, vectorScale(scale, vectorSubtract(from, v)))
}
export function scaleWithFixedPoint(
    scale: number,
    fixed: PlaneVector
): (v: PlaneVector) => PlaneVector {
    return scaleWithMovingPoint(scale, fixed, fixed)
}
export function scaleRectWithFixedPoint(
    [position, size]: PlaneRect,
    scale: number,
    fixed: PlaneVector,
): PlaneRect {
    return [scaleWithFixedPoint(scale, fixed)(position), vectorScale(scale, size)]
}
export function scaleRectWithMinSize(
    [position, size]: PlaneRect,
    scale: number,
    fixed: PlaneVector,
    min: number
): PlaneRect {
    if (size[0] * scale < min) scale = min / size[0]
    if (size[1] * scale < min) scale = min / size[1]
    return scaleRectWithFixedPoint([position, size], scale, fixed)
}

export function divideRectByHalf(
    [[x, y], [w, h]]: PlaneRect,
    axis: PlaneAxis
): [PlaneRect, PlaneRect] {
    return axis === PlaneAxis.X ? [
        [[x, y], [w / 2, h]],
        [[x + w / 2, y], [w / 2, h]],
    ] : [
        [[x, y], [w, h / 2]],
        [[x, y + h / 2], [w, h / 2]],
    ]
}
export function rectCenter([[x, y], [w, h]]: PlaneRect): PlaneVector {
    return [x + w / 2, y + h / 2]
}
export function scaleToFitRectIn(
    [_, [w, h]]: PlaneRect,
    [sw, sh]: PlaneSize
): number {
    return Math.min(sw / w, sh / h)
}
