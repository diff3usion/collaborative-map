import { PlaneAxis, PlaneVector, SizedViewport, Viewport, } from "../../../Type"
import { numberBounded, nearestSmallerPowerOf2 } from "../../../utils/math"
import { initArray, Diff, twoMapsDiff } from "../../../utils/collection"
import { positionShift } from "../../../utils/geometry"

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
export type GridMaps = Readonly<Record<PlaneAxis, GridLineDataMap>>
export type GridMapsDiff = Readonly<Record<PlaneAxis, Diff<GridLineDataMap>>>
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
    length: number,
    gap: number,
    scale: number,
): number[] {
    const start = Math.ceil(delta / scale / gap) * gap
    const count = Math.ceil(Math.floor(length / scale - (start - delta / scale)) / gap)
    return initArray(count, idx => start + idx * gap)
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
    const res = new Map<number, GridLineData>()
    positions
        .map(p => initGridLineData(axis, viewport, length, p))
        .forEach(l => res.set(l.relativePosition, l))
    return res
}

export function initGridData(
    { size, viewport }: SizedViewport,
    options: GridOptions,
): GridData {
    const [width, height] = size
    const { position: [x, y], scale } = viewport
    const gap = sizeToGridLineGap(options, size, scale)
    const horizontalPositions = gridPositions(-y, height, gap, scale)
    const verticalPositions = gridPositions(-x, width, gap, scale)
    return {
        ...options,
        [PlaneAxis.X]: initGridLineDataMap(PlaneAxis.X, viewport, horizontalPositions, width),
        [PlaneAxis.Y]: initGridLineDataMap(PlaneAxis.Y, viewport, verticalPositions, height),
        gap,
    }
}
export function gridMapsDiff(
    data0: GridMaps,
    data1: GridMaps,
): GridMapsDiff {
    return {
        [PlaneAxis.X]: twoMapsDiff(data0[PlaneAxis.X], data1[PlaneAxis.X]),
        [PlaneAxis.Y]: twoMapsDiff(data0[PlaneAxis.Y], data1[PlaneAxis.Y]),
    }
}
