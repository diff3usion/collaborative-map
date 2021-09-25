import { map, window, withLatestFrom, switchMap, tap, filter, pairwise, scan, merge, Observable } from "rxjs"
import { canvasWheel$, canvasPointerMove$, mainButtonDown$ } from "../intent/Map"
import { rendererCursorStyle$, viewport$, scale$, viewportUpdateObserver, canvasSinglePointerDown$, canvasPointersCurrentlyDown$, filterPointerDownCount, filterSinglePointerIsDown } from "../store/Map"
import { filterIsExploreMode } from "../store/MapExplore"
import { AnimationOptions, PlaneVector, TupleOf, Viewport, ViewportUpdate } from "../Type"
import { boundedNumber, eventToPosition } from "../utils"
import { scaleWithFixedPoint, vectorDist, vectorMean, vectorMinus, vectorNorm } from "../utils/geometry"
import { distinctPlaneVector, distinctViewport, windowPairwise } from "../utils/rx"

const maxScale = 64
const minScale = 1 / 8
const mapCanvasScaleRate = 0.5

function initViewport(position: PlaneVector, scale: number): Viewport {
    return { position, scale }
}

//#region Gesture
type GesturePosition<T extends number> = TupleOf<PlaneVector, T>
type GesturePositionPair<T extends number> = [GesturePosition<T>, GesturePosition<T>]
function collectGesturePositions(
    acc: Map<number, PlaneVector>,
    [event, down]: [PointerEvent, PointerEvent[]]
): Map<number, PlaneVector> {
    down.filter(e => !acc.has(e.pointerId))
        .forEach(e => acc.set(e.pointerId, eventToPosition(e)))
    if (!acc.has(event.pointerId)) return acc
    acc.set(event.pointerId, eventToPosition(event))
    return acc
}
const twoFingerGesture$: Observable<GesturePositionPair<2>> = canvasPointerMove$
    .pipe(
        filterIsExploreMode(),
        filterPointerDownCount(2),
        window(canvasPointersCurrentlyDown$),
        switchMap(ob => ob.pipe(
            withLatestFrom(canvasPointersCurrentlyDown$),
            scan(collectGesturePositions, new Map()),
            filter(map => map.size === 2),
            map(acc => Array.from(acc.entries()).sort(([id0], [id1]) => id0 - id1).map(([_, v]) => v) as GesturePosition<2>),
            pairwise(),
        )),
    )
//#endregion

//#region Pan Action
type PanData = {
    from: PlaneVector
    to: PlaneVector
}
const pinchPanData$: Observable<PanData> = twoFingerGesture$
    .pipe(
        map(([[prev0, prev1], [curr0, curr1]]) => [
            vectorMean(prev0, prev1),
            vectorMean(curr0, curr1),
        ] as [PlaneVector, PlaneVector]),
        map(([from, to]) => ({ from, to })),
    )
const pointerPanData$: Observable<PanData> = canvasPointerMove$
    .pipe(
        filterSinglePointerIsDown(),
        filterIsExploreMode(),
        map(eventToPosition),
        distinctPlaneVector(),
        windowPairwise(mainButtonDown$),
        map(([from, to]) => ({ from, to })),
    )
const panAction$: Observable<ViewportUpdate> =
    merge(
        pinchPanData$,
        pointerPanData$,
    ).pipe(
        map(({ from, to }) => vectorMinus(to, from)),
        filter(delta => vectorNorm(delta) < 128),
        withLatestFrom(viewport$),
        map(([[deltaX, deltaY], { position: [x, y], scale }]) => initViewport([x + deltaX, y + deltaY], scale)),
        distinctViewport(),
        map(viewport => ({ viewport })),
    )
//#endregion

//#region Zoom Action
const wheelZoomLevelMultiplier = 1 / 800
type ZoomData = {
    level: number
    center: PlaneVector
    animation: AnimationOptions
    newScale?: number
}
type CalculatedZoomData = Required<ZoomData>
const pinchZoomData$: Observable<ZoomData> = twoFingerGesture$
    .pipe(
        map(([[prev0, prev1], [curr0, curr1]]) => ({
            level: vectorDist(curr0, curr1) / vectorDist(prev0, prev1),
            center: vectorMean(curr0, curr1),
            animation: { duration: 100 },
        }))
    )
const wheelZoomData$: Observable<ZoomData> = canvasWheel$
    .pipe(
        filterIsExploreMode(),
        map(event => ({
            level: (1 + event.deltaY * wheelZoomLevelMultiplier * mapCanvasScaleRate),
            center: eventToPosition(event),
            animation: { duration: 400 },
        })),
    )
function calculateNewScale(
    oldScale: number,
    zoomData: ZoomData
): CalculatedZoomData {
    zoomData.newScale = boundedNumber(minScale, maxScale, oldScale * zoomData.level)
    return zoomData as CalculatedZoomData
}
function scaledAndRecentered(
    { position, scale: oldScale }: Viewport,
    { newScale, center, animation }: CalculatedZoomData
): ViewportUpdate {
    return {
        viewport: initViewport(scaleWithFixedPoint(newScale / oldScale, center)(position), newScale),
        animation,
    }
}
const zoomAction$ =
    merge(
        wheelZoomData$,
        pinchZoomData$,
    ).pipe(
        withLatestFrom(scale$),
        map(([zoomData, oldScale]) => calculateNewScale(oldScale, zoomData)),
        withLatestFrom(viewport$),
        map(([zoomData, viewport]) => scaledAndRecentered(viewport, zoomData)),
    )
//#endregion

//#region Viewport Update
const panAndZoom$: Observable<ViewportUpdate> =
    merge(
        panAction$,
        zoomAction$,
    )
panAndZoom$
    .subscribe(viewportUpdateObserver)
//#endregion

//#region Grabbing Cursor Style
canvasSinglePointerDown$
    .pipe(
        filterIsExploreMode(),
        map(down => down ? 'grabbing' : 'grab')
    )
    .subscribe(rendererCursorStyle$)
//#endregion
