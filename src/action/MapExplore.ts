import { map, pairwise, window, withLatestFrom, switchMap, tap } from "rxjs"
import { canvasWheel$ } from "../intent/Map"
import { rendererPointerIsDown$, rendererCursorStyle$, viewport$, scale$, viewportUpdateObserver } from "../store/Map"
import { filterIsExploreMode } from "../store/MapExplore"
import { PlaneVector, Viewport, ViewportUpdate, MapControlMode } from "../Type"
import { boundedNumber, eventToGlobalPosition, mouseEventToPlaneVector } from "../utils"
import { scaleRectWithFixedPoint, scaleWithFixedPoint } from "../utils/geometry"
import { distinctPlaneVector, distinctViewport } from "../utils/rx"
import { mainButtonDown$, mainButtonDownAndMove$ } from "./Pointer"

const maxScale = 64
const minScale = 1 / 8
const mapCanvasScaleRate = 0.5

const initViewport: (position: PlaneVector, scale: number) => Viewport
    = (position, scale) => ({ position, scale })

//#region Pan Action
const panAction$ = mainButtonDownAndMove$
    .pipe(
        filterIsExploreMode(),
        map(eventToGlobalPosition),
        distinctPlaneVector(),
        window(mainButtonDown$),
        switchMap(ob => ob.pipe(
            pairwise(),
            map(([[prevX, prevY], [moveX, moveY]]) => ([moveX - prevX, moveY - prevY] as PlaneVector)),
            withLatestFrom(viewport$),
            map(([[deltaX, deltaY], { position: [x, y], scale }]) => initViewport([x + deltaX, y + deltaY], scale)),
        )),
        distinctViewport(),
    )
//#endregion

//#region Zoom Action
const newScale: (oldScale: number, isZoomIn: boolean) => number
    = (oldScale, isZoomIn) =>
        boundedNumber(minScale, maxScale, oldScale * (1 + (isZoomIn ? 1 : -1) * mapCanvasScaleRate))

const scaledAndRecentered: (viewport: Viewport, scale: number, scaleCenter: PlaneVector) => Viewport
    = ({ position, scale: oldScale }, newScale, scaleCenter) =>
        initViewport(scaleWithFixedPoint(newScale / oldScale, scaleCenter)(position), newScale)

const zoomAction$ = canvasWheel$.pipe(
    filterIsExploreMode(),
    map(event => [event.deltaY > 0, mouseEventToPlaneVector(event)] as [boolean, PlaneVector]),
    withLatestFrom(scale$),
    map(([[isZoomIn, mousePos], oldScale]) => [newScale(oldScale, isZoomIn), mousePos] as [number, PlaneVector]),
    withLatestFrom(viewport$),
    map(([[scale, scaleCenter], viewport]) => scaledAndRecentered(viewport, scale, scaleCenter)),
    distinctViewport(),
)
//#endregion

//#region Viewport Update
panAction$.pipe(
    distinctViewport(),
    map(viewport => ({ viewport, animated: false })),
).subscribe(viewportUpdateObserver)

zoomAction$.pipe(
    map(viewport => ({ viewport, animated: true })),
).subscribe(viewportUpdateObserver)
//#endregion

//#region Grabbing Cursor Style
rendererPointerIsDown$
    .pipe(
        filterIsExploreMode(),
        map(downButton => downButton === 0 ? 'grabbing' : 'grab'))
    .subscribe(rendererCursorStyle$)
//#endregion
