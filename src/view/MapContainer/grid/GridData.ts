import { PlaneVector, SizedViewport, Viewport, } from "../../../Type"
import { boundedNumber, nearestSmallerPowerOf2 } from "../../../utils"
import { initArray } from "../../../utils/collection"
import { positionShift } from "../../../utils/geometry"

export type GridLineData = Readonly<{
    relativePosition: number
    isHorizontal: boolean
    position: number
    length: number
}>
export type GridLineDataMap = Map<number, GridLineData>
export type GridOptions = Readonly<{
    desiredLineCount: number
    minLineGap: number
    maxLineGap: number
}>
export type GridData = Readonly<{
    options: GridOptions
    horizontalLines: GridLineDataMap
    verticalLines: GridLineDataMap
    gap: number,
}>

function sizeToGridLineGap(
    { minLineGap, maxLineGap, desiredLineCount }: GridOptions,
    size: PlaneVector,
    scale: number,
): number {
    return boundedNumber(
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
    isHorizontal: boolean,
    viewport: Viewport,
    length: number,
    relativePosition: number
): GridLineData {
    return {
        relativePosition,
        isHorizontal,
        position: positionShift(relativePosition, isHorizontal, viewport),
        length,
    }
}
function initGridLineDataMap(
    isHorizontal: boolean,
    viewport: Viewport,
    positions: number[],
    length: number,
): GridLineDataMap {
    const res = new Map<number, GridLineData>()
    positions
        .map(p => initGridLineData(isHorizontal, viewport, length, p))
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
    const horizontalLines = initGridLineDataMap(true, viewport, horizontalPositions, width)
    const verticalLines = initGridLineDataMap(false, viewport, verticalPositions, height)
    return { options, horizontalLines, verticalLines, gap }
}
