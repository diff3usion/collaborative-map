import { Container } from "pixi.js"
import { Subject, map, tap } from "rxjs"
import { PerAxis, PlaneAxis, PlaneRect, SizedViewport, Viewport } from "../../../Type"
import { Diff, MapDiff, twoMapsDiff } from "../../../utils/collection"
import { planeRectUnshift, positionShift } from "../../../utils/geometry"
import { fromAxis } from "../../../utils/object"
import { sizedViewport$ } from "../../../store/Map"
import { GridData } from "./GridData"
import { GridGraphicsGroup } from "./GridGraphicsGroup"
import { GridLineGraphics } from "./GridLineGraphics"
import { getGridLineStyle } from "./GridLineStyleTemplates"

const defaultGridOptions: GridData.Options = {
    desiredLineCount: 16,
    minLineGap: 4,
    maxLineGap: 1024,
}

export const gridContainer = new Container()
gridContainer.sortableChildren = true
gridContainer.zIndex = 0

export const gridGraphicsGroup = GridGraphicsGroup.init(
    GridData.fromRect(
        [[0, 0], [0, 0]],
        defaultGridOptions
    ),
    gridContainer,
)

function shiftLineData(
    { length, position, axis }: GridData.Line,
    viewport: Viewport,
): GridLineGraphics.RelativeData {
    const relativeLength = length * viewport.scale
    const relativePosition = positionShift(position, axis, viewport)
    return { relativeLength, relativePosition }
}
function updateGraphicsMap(
    axis: PlaneAxis,
    diff: MapDiff<number, GridData.Line>,
    data: GridData.Obj,
    viewport: Viewport,
): void {
    const { addition, deletion, update } = diff
    for (let line of addition.values()) {
        const relativeData = shiftLineData(line, viewport)
        GridGraphicsGroup.add(gridGraphicsGroup, axis, GridLineGraphics.init({ ...line, ...relativeData, ...getGridLineStyle(line, data, relativeData) }))
    }
    for (let [_, line] of update.values()) {
        const relativeData = shiftLineData(line, viewport)
        GridGraphicsGroup.update(gridGraphicsGroup, axis, { ...line, ...relativeData, ...getGridLineStyle(line, data, relativeData) })
    }
    for (let p of deletion.keys())
        GridGraphicsGroup.remove(gridGraphicsGroup, axis, p)
}

export type GridMapsDiff = Readonly<PerAxis<Diff<GridData.LineMap>>>
export function gridMapsDiff(
    data0: GridData.AxisMaps,
    data1: GridData.AxisMaps,
): GridMapsDiff {
    return fromAxis(axis => twoMapsDiff(data0[axis], data1[axis]))
}

const gridUpdate$ = new Subject<SizedViewport>()

function rectFromSizedViewport(svp: SizedViewport): PlaneRect {
    return planeRectUnshift([[0, 0], svp.size], svp.viewport)
}
gridUpdate$
    .pipe(
        map(svp => <const>[svp.viewport, GridData.fromRect(rectFromSizedViewport(svp), defaultGridOptions)]),
    )
    .subscribe(([viewport, data]) => {
        const { [PlaneAxis.X]: xUpdate, [PlaneAxis.Y]: yUpdate } = gridMapsDiff(gridGraphicsGroup, data)
        updateGraphicsMap(PlaneAxis.X, xUpdate, data, viewport)
        updateGraphicsMap(PlaneAxis.Y, yUpdate, data, viewport)
    })

sizedViewport$
    .subscribe(gridUpdate$)
