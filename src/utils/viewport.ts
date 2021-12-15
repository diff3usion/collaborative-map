import * as LA from 'gl-matrix'
import { MonoTypeOperatorFunction, distinctUntilChanged } from 'rxjs'
import { PlaneTransformation } from "../type/plane"
import { Viewport } from "../type/viewport"
import { vectorScale, vectorOnes, vectorInverseScale, vectorAddInverse } from "./math"

export function viewportTransformation(
    { position, scale }: Viewport,
): PlaneTransformation {
    const res = LA.mat3.fromTranslation(LA.mat3.create(), position)
    return LA.mat3.scale(res, res, vectorScale(scale, vectorOnes(2)))
}
export function viewportInverseTransformation(
    { position, scale }: Viewport,
): PlaneTransformation {
    const res = LA.mat3.fromScaling(LA.mat3.create(), vectorInverseScale(scale, vectorOnes(2)))
    return LA.mat3.translate(res, res, vectorAddInverse(position))
}

export function distinctViewport(): MonoTypeOperatorFunction<Viewport> {
    return distinctUntilChanged<Viewport>(({ position: [prevX, prevY], scale: prevScale }, { position: [x, y], scale }) =>
        prevX === x && prevY === y && prevScale === scale)
}
