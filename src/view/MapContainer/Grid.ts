import { Container } from "pixi.js"
import { combineLatestWith, map, tap } from "rxjs"
import { GridData, defaultGridOptions } from "./grid/GridData"
import { GridGraphicsGroup } from "./grid/GridGraphicsGroup"
import { planeRectTransform, planeRectAligned } from "../../utils/plane"

import { canvasSize$ } from "../../intent/Map"
import { viewportTransformation$ } from "../../store/Map"

export const gridContainer = new Container()
gridContainer.sortableChildren = true
gridContainer.zIndex = 0

export const gridGraphicsGroup = GridGraphicsGroup.init(gridContainer)

viewportTransformation$
    .pipe(
        combineLatestWith(canvasSize$),
        map(([[trans, invTrans], size]) =>
            <const>[trans, planeRectTransform(invTrans, planeRectAligned(size))]),
        map(([trans, rect]) =>
            <const>[trans, GridData.init(rect)]),
    )
    .subscribe(([trans, data]) => GridGraphicsGroup.update(gridGraphicsGroup, trans, data))
