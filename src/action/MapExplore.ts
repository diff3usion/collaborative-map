import { map, pairwise, window, withLatestFrom, switchMap, tap } from "rxjs"
import { canvasWheel$ } from "../intent/Map"
import { rendererPointerIsDown$, rendererCursorStyle$, viewport$, scale$, viewportUpdateObserver } from "../store/Map"
import { filterControlMode } from "../store/MapControl"
import { PlaneVector, Viewport, ViewportUpdate, MapControlMode } from "../Type"
import { boundedNumber, eventToGlobalPosition, mouseEventToPlaneVector } from "../utils"
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
        filterControlMode(MapControlMode.Explore),
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
type ScaleAndCenter = [number, PlaneVector]
const newScale: (oldScale: number, isZoomIn: boolean, center: PlaneVector) => ScaleAndCenter
    = (oldScale, isZoomIn, center) =>
        [boundedNumber(minScale, maxScale, oldScale * (1 + (isZoomIn ? 1 : -1) * mapCanvasScaleRate)), center]

const scaledAndRecentered: (viewport: Viewport, scale: number, scaleCenter: PlaneVector) => Viewport
    = ({ position: [posX, posY], scale: oldScale }, newScale, [centerX, centerY]) =>
        initViewport([
            centerX - (centerX - posX) * newScale / oldScale,
            centerY - (centerY - posY) * newScale / oldScale,
        ], newScale)

const zoomAction$ = canvasWheel$.pipe(
    filterControlMode(MapControlMode.Explore),
    map(event => <const>[event.deltaY > 0, mouseEventToPlaneVector(event)]),
    withLatestFrom(scale$),
    map(([[isZoomIn, mousePos], oldScale]) => newScale(oldScale, isZoomIn, mousePos)),
    withLatestFrom(viewport$),
    map(([[scale, scaleCenter], viewport]) => scaledAndRecentered(viewport, scale, scaleCenter)),
    distinctViewport(),
)
//#endregion

//#region Viewport Update
const initViewportUpdate: (viewport: Viewport, animated: boolean) => ViewportUpdate
    = (viewport, animated) => ({ viewport, animated })

panAction$.pipe(
    distinctViewport(),
    map(vp => initViewportUpdate(vp, false)),
).subscribe(viewportUpdateObserver)

zoomAction$.pipe(
    map(vp => initViewportUpdate(vp, true)),
).subscribe(viewportUpdateObserver)
//#endregion

//#region Grabbing Cursor Style
rendererPointerIsDown$
    .pipe(
        filterControlMode(MapControlMode.Explore),
        map(downButton => downButton === 0 ? 'grabbing' : 'grab'))
    .subscribe(rendererCursorStyle$)
//#endregion
