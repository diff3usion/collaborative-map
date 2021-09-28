import { Container } from "pixi.js"
import { Subject, map, tap } from "rxjs"
import { sizedViewport$ } from "../../../store/Map"
import { SizedViewport } from "../../../Type"
import { GridOptions, initGridData } from "./GridData"
import { initGridGraphicsGroup, updateGridGraphicsGroup } from "./GridGraphicsGroup"

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
    initGridData(
        initSizedViewport(),
        defaultGridOptions
    ),
    gridContainer,
)

const gridUpdate$ = new Subject<SizedViewport>()
const gridData$ = gridUpdate$
    .pipe(
        map(svp => initGridData(svp, defaultGridOptions))
    )

gridData$
    .subscribe(data => updateGridGraphicsGroup(gridGraphicsGroup, data))

gridData$.pipe(

)

sizedViewport$
    .subscribe(gridUpdate$)
