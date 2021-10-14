import { Container } from "pixi.js"
import { Subject, map, tap } from "rxjs"
import { sizedViewport$ } from "../../../store/Map"
import { PerAxis, PlaneAxis, SizedViewport } from "../../../Type"
import { Diff, MapDiff, twoMapsDiff } from "../../../utils/collection"
import { fromAxis } from "../../../utils/object"
import { GridData, GridLineData, GridLineDataMap, GridMaps, GridOptions, sizedViewportToGridData } from "./GridData"
import { GridGraphicsGroup, gridGraphicsGroupAdd, gridGraphicsGroupRemove, gridGraphicsGroupUpdate, initGridGraphicsGroup } from "./GridGraphicsGroup"
import { initGridLineGraphics } from "./GridLineGraphics"
import { getGridLineStyle } from "./GridLineStyleTemplates"

const defaultGridOptions: GridOptions = {
    desiredLineCount: 16,
    minLineGap: 4,
    maxLineGap: 1024,
}

export const gridContainer = new Container()
gridContainer.sortableChildren = true
gridContainer.zIndex = 0

function initSizedViewport(): SizedViewport {
    return { size: [0, 0], viewport: { scale: 1, position: [0, 0] } }
}
export const gridGraphicsGroup = initGridGraphicsGroup(
    sizedViewportToGridData(
        initSizedViewport(),
        defaultGridOptions
    ),
    gridContainer,
)

const gridUpdate$ = new Subject<SizedViewport>()
const gridData$ = gridUpdate$
    .pipe(
        map(svp => sizedViewportToGridData(svp, defaultGridOptions))
    )

function updateGraphicsMap(
    axis: PlaneAxis,
    diff: MapDiff<number, GridLineData>,
    data: GridData,
): void {
    const { addition, deletion, update } = diff
    for (let line of addition.values())
        gridGraphicsGroupAdd(gridGraphicsGroup, axis, initGridLineGraphics({ ...line, ...getGridLineStyle(line, data) }))
    for (let [_, line] of update.values())
        gridGraphicsGroupUpdate(gridGraphicsGroup, axis, { ...line, ...getGridLineStyle(line, data) })
    for (let p of deletion.keys())
        gridGraphicsGroupRemove(gridGraphicsGroup, axis, p)
}

export type GridMapsDiff = Readonly<PerAxis<Diff<GridLineDataMap>>>
export function gridMapsDiff(
    data0: GridMaps,
    data1: GridMaps,
): GridMapsDiff {
    return fromAxis(axis => twoMapsDiff(data0[axis], data1[axis]))
}

gridData$
    .subscribe(data => {
        const { [PlaneAxis.X]: xUpdate, [PlaneAxis.Y]: yUpdate } = gridMapsDiff(gridGraphicsGroup, data)
        updateGraphicsMap(PlaneAxis.X, xUpdate, data)
        updateGraphicsMap(PlaneAxis.Y, yUpdate, data)
    })

sizedViewport$
    .subscribe(gridUpdate$)
