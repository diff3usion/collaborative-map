import { PerAxis, PlaneAxis, PlaneVector, SizedViewport, Viewport, } from "../../../Type"
import { arrayInit as arrayInit, mapInit } from "../../../utils/collection"
import { positionShift } from "../../../utils/geometry"
import { numberBounded, nearestSmallerPowerOf2 } from "../../../utils/math"
import { fromAxis } from "../../../utils/object"

export type GridLineData = Readonly<{
    relativePosition: number
    axis: PlaneAxis
    position: number
    length: number
}>
export type GridLineDataMap = Map<number, GridLineData>
export type GridOptions = Readonly<{
    desiredLineCount: number
    minLineGap: number
    maxLineGap: number
}>
export type GridState = Readonly<{
    gap: number
}>
export type GridMaps = Readonly<PerAxis<GridLineDataMap>>
export type GridData = GridOptions & GridMaps & GridState

function sizeToGridLineGap(
    { minLineGap, maxLineGap, desiredLineCount }: GridOptions,
    size: PlaneVector,
    scale: number,
): number {
    return numberBounded(
        minLineGap,
        maxLineGap,
        Math.min(...size.map(s => nearestSmallerPowerOf2(s / scale / desiredLineCount)))
    )
}
function gridPositions(
    delta: number,
    range: number,
    gap: number,
    scale: number,
): number[] {
    const start = Math.ceil(delta / scale / gap) * gap
    const count = Math.ceil(Math.floor(range / scale - (start - delta / scale)) / gap)
    return arrayInit(count, idx => start + idx * gap)
}
function initGridLineData(
    axis: PlaneAxis,
    viewport: Viewport,
    length: number,
    relativePosition: number
): GridLineData {
    return {
        relativePosition,
        axis,
        position: positionShift(relativePosition, axis, viewport),
        length,
    }
}
function initGridLineDataMap(
    axis: PlaneAxis,
    viewport: Viewport,
    positions: number[],
    length: number,
): GridLineDataMap {
    return mapInit(positions, p => initGridLineData(axis, viewport, length, p))
}

export function sizedViewportToGridData(
    { size, viewport }: SizedViewport,
    options: GridOptions,
): GridData {
    const [width, height] = size
    const { position: [x, y], scale } = viewport
    const gap = sizeToGridLineGap(options, size, scale)
    const deltas = [-y, -x]
    const ranges = [height, width]
    const lengths = [width, height]
    const positions = fromAxis(axis => gridPositions(deltas[axis], ranges[axis], gap, scale))
    const dataMaps = fromAxis(axis => initGridLineDataMap(axis, viewport, positions[axis], lengths[axis]))
    return { gap, ...options, ...dataMaps }
}
