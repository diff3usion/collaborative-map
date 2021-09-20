import { PlaneVector, Viewport, } from "../../../Type"
import { boundedNumber, nearestSmallerPowerOf2 } from "../../../utils"
import { initArray, mapFilter, RecordedMap, RecordedMapActions } from "../../../utils/collection"
import { positionShift } from "../../../utils/geometry"

export type GridLine = {
    relativePosition: number
    isHorizontal: boolean
    position: number
    length: number
}
type GridLineMap = RecordedMap<number, GridLine>
export type GridUpdate = {
    positions: number[],
    actions: RecordedMapActions<number, GridLine>
}
export class Grid {
    private horizLines: GridLineMap = new RecordedMap()
    private vertiLines: GridLineMap = new RecordedMap()

    private sizeToGridLineGap(
        size: PlaneVector,
        scale: number
    ): number {
        return boundedNumber(
            this.minLineGap,
            this.maxLineGap,
            Math.min(...size.map(s => nearestSmallerPowerOf2(s / scale / this.desiredLineCount)))
        )
    }

    private gridPositions(
        delta: number,
        length: number,
        gap: number,
        scale: number,
    ): number[] {
        const start = Math.ceil(delta / scale / gap) * gap
        const count = Math.ceil(Math.floor(length / scale - (start - delta / scale)) / gap)
        return initArray(count, idx => start + idx * gap)
    }

    private updateGridLines(
        isHorizontal: boolean,
        lines: GridLineMap,
        viewport: Viewport,
        positions: number[],
        length: number,
    ): GridUpdate {
        const gridLineShift = (relativePosition: number) => ({
            relativePosition,
            isHorizontal,
            position: positionShift(relativePosition, isHorizontal, viewport),
            length,
        })
        const positionSet = new Set(positions)
        positions
            .map(gridLineShift)
            .forEach(l => lines.set(l.relativePosition, l))
        mapFilter(lines, p => !positionSet.has(p))
            .forEach(l => lines.delete(l.relativePosition))
        const actions = lines.popRecord()
        return { positions, actions }
    }

    public constructor(
        public desiredLineCount = 16,
        public minLineGap = 4,
        public maxLineGap = 1024,
    ) { }

    public update: (size: PlaneVector, viewport: Viewport) => [GridUpdate, GridUpdate]
        = ([width, height], viewport) => {
            const { position: [x, y], scale } = viewport
            const gap = this.sizeToGridLineGap([width, height], scale)
            const horizPositions = this.gridPositions(-y, height, gap, scale)
            const vertiPositions = this.gridPositions(-x, width, gap, scale)
            return [
                this.updateGridLines(true, this.horizLines, viewport, horizPositions, width),
                this.updateGridLines(false, this.vertiLines, viewport, vertiPositions, height),
            ]
        }
}
