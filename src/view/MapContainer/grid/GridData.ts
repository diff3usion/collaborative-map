import { PerAxis, PlaneAxis, PlaneRect, PlaneSize } from "../../../type/plane"
import { arrayInit, mapInit } from "../../../utils/collection"
import { fromAxis, planeRectZeros } from "../../../utils/plane"
import { numberBounded, nearestSmallerPowerOf2 } from "../../../utils/math"

export const defaultGridOptions: GridOptions = {
    desiredLineCount: 16,
    minLineGap: 4,
    maxLineGap: 1024,
}

export type GridData = GridData.Obj
export type GridLineData = GridData.Line
export type GridOptions = GridData.Options
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
    type AxisMaps = PerAxis<LineMap>
    type Derived = Readonly<AxisMaps & {
        gap: number
    }>
    export type Obj = Options & Derived

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

    export function init(
        [[x, y], size]: PlaneRect = planeRectZeros(),
        options = defaultGridOptions,
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
