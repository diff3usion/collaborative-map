import { map, filter, pairwise, window, withLatestFrom, switchMap, distinctUntilChanged, tap } from "rxjs"
import { canvasWheel$, rendererPointerDown$, rendererPointerMove$ } from "../intent/Map"
import { MapControlMode } from "../model/Type"
import { rendererPointerIsDown$, rendererCursorStyle$, cursorRelativePosition$, viewport$, scale$, viewportUpdateObserver, filterPointerIsDown, mapToRelativePosition } from "../store/Map"
import { filterControlMode } from "../store/MapControl"
import { PlaneVector, EventButtonType, Viewport, ViewportUpdate } from "../Type"
import { boundedNumber, mouseEventToPlaneVector } from "../utils"
import { distinctPlaneVector, distinctViewport, mapToEventGlobalPosition } from "../utils/rx"

const maxScale = 64
const minScale = 1 / 8
const mapCanvasScaleRate = 0.5

const initViewport: (position: PlaneVector, scale: number) => Viewport
    = (position, scale) => ({ position, scale })

const initViewportUpdate: (viewport: Viewport, animated: boolean) => ViewportUpdate
    = (viewport, animated) => ({ viewport, animated })

const startPanEvent$ = rendererPointerIsDown$
    .pipe(
        filter(type => type === EventButtonType.Main),
        filterControlMode(MapControlMode.Explore),
    )

const panAction$ = rendererPointerMove$
    .pipe(
        filterControlMode(MapControlMode.Explore),
        filterPointerIsDown(EventButtonType.Main),
        mapToEventGlobalPosition(),
        distinctPlaneVector(),
        window(startPanEvent$),
        switchMap(ob => ob.pipe(
            pairwise(),
            map(([[prevX, prevY], [moveX, moveY]]) => ([moveX - prevX, moveY - prevY] as PlaneVector)),
            withLatestFrom(viewport$),
            map(([[deltaX, deltaY], { position: [x, y], scale }]) => initViewport([x + deltaX, y + deltaY], scale)),
        )),
    )

const newScale = (oldScale: number, isZoomIn: boolean) =>
    boundedNumber(minScale, maxScale, oldScale * (1 + (isZoomIn ? 1 : -1) * mapCanvasScaleRate))

const recenteredPosition: (scale: number, scaleCenter: PlaneVector, viewport: Viewport) => PlaneVector
    = (scale, [mouseX, mouseY], { position: [posX, posY], scale: oldScale }) => [
        mouseX - (mouseX - posX) * scale / oldScale,
        mouseY - (mouseY - posY) * scale / oldScale,
    ]

const zoomAction$ = canvasWheel$.pipe(
    filterControlMode(MapControlMode.Explore),
    map(event => <const>[event.deltaY > 0, mouseEventToPlaneVector(event)]),
    withLatestFrom(scale$),
    map(([[isZoomIn, mousePos], oldScale]) => <const>[newScale(oldScale, isZoomIn), mousePos]),
    distinctUntilChanged(),
    withLatestFrom(viewport$),
    map(([[scale, scaleCenter], viewport]) => initViewport(recenteredPosition(scale, scaleCenter, viewport), scale)),
)

panAction$.pipe(
    distinctViewport(),
    map(vp => initViewportUpdate(vp, false)),
).subscribe(viewportUpdateObserver)

zoomAction$.pipe(
    map(vp => initViewportUpdate(vp, true)),
).subscribe(viewportUpdateObserver)

rendererPointerMove$
    .pipe(
        mapToEventGlobalPosition(),
        distinctPlaneVector(),
        mapToRelativePosition(),
    )
    .subscribe(cursorRelativePosition$)

rendererPointerIsDown$
    .pipe(
        filterControlMode(MapControlMode.Explore),
        map(downButton => downButton === 0 ? 'grabbing' : 'grab'))
    .subscribe(rendererCursorStyle$)

