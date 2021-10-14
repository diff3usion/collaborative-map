import { PerAxis, PlaneAxis, PlaneRect, PlaneSize } from "../../../Type"
import { arrayInit as arrayInit, mapInit } from "../../../utils/collection"
import { numberBounded, nearestSmallerPowerOf2 } from "../../../utils/math"
import { fromAxis } from "../../../utils/object"

export module GridData {
    export type Line = Readonly<{
        axis: PlaneAxis
        position: number
        length: number
    }>
    export type LineMap = Map<number, Line>
    export type Options = Readonly<{
        desiredLineCount: number
        minLineGap: number
        maxLineGap: number
    }>
    export type State = Readonly<{
        gap: number
    }>
    export type AxisMaps = Readonly<PerAxis<LineMap>>
    export type Obj = Options & AxisMaps & State

    function sizeToLineGap(
        { minLineGap, maxLineGap, desiredLineCount }: Options,
        size: PlaneSize,
    ): number {
        return numberBounded(
            minLineGap,
            maxLineGap,
            Math.min(...size.map(s => nearestSmallerPowerOf2(s / desiredLineCount)))
        )
    }
    function linePositions(
        delta: number,
        range: number,
        gap: number,
    ): number[] {
        const start = Math.ceil(delta / gap) * gap
        const count = Math.ceil(Math.floor(range - (start - delta)) / gap)
        return arrayInit(count, idx => start + idx * gap)
    }
    function initLine(
        axis: PlaneAxis,
        length: number,
        position: number
    ): Line {
        return {
            position,
            axis,
            length,
        }
    }
    function initLineMap(
        axis: PlaneAxis,
        positions: number[],
        length: number,
    ): LineMap {
        return mapInit(positions, p => initLine(axis, length, p))
    }

    export function fromRect(
        [[x, y], size]: PlaneRect,
        options: Options,
    ): Obj {
        const [width, height] = size
        const gap = sizeToLineGap(options, size)
        const deltas = [y, x]
        const ranges = [height, width]
        const lengths = [width, height]
        const positions = fromAxis(axis => linePositions(deltas[axis], ranges[axis], gap))
        const dataMaps = fromAxis(axis => initLineMap(axis, positions[axis], lengths[axis]))
        return { gap, ...options, ...dataMaps }
    }
}
