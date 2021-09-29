import { map, window, withLatestFrom, switchMap, tap, filter, pairwise, scan, merge, Observable, OperatorFunction, Subject, startWith, share, MonoTypeOperatorFunction } from "rxjs"
import { canvasWheel$, canvasPointerMove$, mainButtonDown$ } from "../intent/Map"
import { viewport$, scale$, canvasPointersCurrentlyDown$, filterPointerDownCount, filterSinglePointerIsDown } from "../store/Map"
import { filterIsExploreMode } from "../store/MapExplore"
import { PlaneVector, TupleOf, Viewport } from "../Type"
import { numberBounded, eventToPosition, twoNumbersSameSign } from "../utils"
import { scaleWithFixedPoint, vectorDist, vectorMean, vectorMinus, vectorNorm } from "../utils/geometry"
import { distinctPlaneVector, distinctViewport, filterWithLatestFrom, transitionTimerSubscription, windowPairwise } from "../utils/rx"
import { linear, Transition, transitionViewport, TransitionOptions } from "../utils/transition"

const maxScale = 64
const minScale = 1 / 8

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
function mapPanDataToViewport(): OperatorFunction<PanData, Viewport> {
    return ob => ob.pipe(
        map(({ from, to }) => vectorMinus(to, from)),
        filter(delta => vectorNorm(delta) < 128),
        withLatestFrom(viewport$),
        map(([[deltaX, deltaY], { position: [x, y], scale }]) => initViewport([x + deltaX, y + deltaY], scale)),
        distinctViewport(),
        share(),
    )
}
const pinchPanViewport$ = pinchPanData$
    .pipe(
        mapPanDataToViewport()
    )
const pointerPanViewport$ = pointerPanData$
    .pipe(
        mapPanDataToViewport()
    )
//#endregion

//#region Zoom Action
const wheelZoomLevelMultiplierOnce = 1 / 1000
const wheelZoomLevelMultiplierHold = 1 / 400
const wheelEventHoldThreshold = 100
type ZoomData = {
    level: number
    center: PlaneVector
    // animation: AnimationOptions
    newScale?: number
}
type CalculatedZoomData = Required<ZoomData>
function wheelZoomLevelMultiplier(
    prevEvent: WheelEvent,
    prevTime: number,
    currEvent: WheelEvent,
    currTime: number,
): number {
    return twoNumbersSameSign(prevEvent.deltaY, currEvent.deltaY)
        && currTime - prevTime < wheelEventHoldThreshold
        ? wheelZoomLevelMultiplierHold
        : wheelZoomLevelMultiplierOnce
}
function withWheelZoomLevelMultiplier(): OperatorFunction<WheelEvent, [WheelEvent, number]> {
    return ob => ob.pipe(
        map(event => [event, Date.now()] as [WheelEvent, number]),
        pairwise(),
        map(([[prevEvent, prevTime], [currEvent, currTime]]) =>
            [currEvent, wheelZoomLevelMultiplier(prevEvent, prevTime, currEvent, currTime)]),
    )
}
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
        withWheelZoomLevelMultiplier(),
        map(([event, multiplier]) => ({
            level: (1 + event.deltaY * multiplier),
            center: eventToPosition(event),
            animation: { duration: 400 },
        })),
    )
function calculateNewScale(
    oldScale: number,
    zoomData: ZoomData
): CalculatedZoomData {
    zoomData.newScale = numberBounded(minScale, maxScale, oldScale * zoomData.level)
    return zoomData as CalculatedZoomData
}
function scaledAndRecentered(
    { position, scale: oldScale }: Viewport,
    { newScale, center }: CalculatedZoomData
): Viewport {
    return initViewport(scaleWithFixedPoint(newScale / oldScale, center)(position), newScale)
}
function mapZoomDataToViewport(): OperatorFunction<ZoomData, Viewport> {
    return ob => ob.pipe(
        withLatestFrom(scale$),
        map(([zoomData, oldScale]) => calculateNewScale(oldScale, zoomData)),
        withLatestFrom(viewport$),
        map(([zoomData, viewport]) => scaledAndRecentered(viewport, zoomData)),
        distinctViewport(),
        share(),
    )
}
const wheelZoomViewport$ = wheelZoomData$
    .pipe(
        mapZoomDataToViewport(),
    )
const pinchZoomViewport$ = pinchZoomData$
    .pipe(
        mapZoomDataToViewport(),
    )
//#endregion

//#region Smoothen
const continuousViewport$: Observable<Viewport> =
    merge(
        pointerPanViewport$,
        pinchPanViewport$,
        pinchZoomViewport$,
    )

const viewportTransition$ = new Subject<Transition<Viewport>>()
const viewportIntermediate$ = new Subject<Observable<Viewport>>()
function withLatestTickingTransition<T>(): OperatorFunction<T, [T, Transition<Viewport>]> {
    return obs => obs.pipe(
        withLatestFrom(viewportTransition$),
        filter(([_, transition]) => transition.ticking)
    )
}
function filterLatestTransitionNotTicking<T>(): MonoTypeOperatorFunction<T> {
    return filterWithLatestFrom(
        viewportTransition$.pipe(startWith(undefined)),
        prevTransition => !prevTransition || !prevTransition.ticking
    )
}

const wheelZoomViewportTransitionOptions: TransitionOptions<Viewport> = {
    duration: 200,
    fn: transitionViewport(linear),
}
const wheelZoomViewportTransitionTargetFps = 120
wheelZoomViewport$
    .pipe(
        filterLatestTransitionNotTicking(),
        withLatestFrom(viewport$),
    )
    .subscribe(([to, from]) => {
        const intermediate$ = new Subject<Viewport>()
        const transition = new Transition<Viewport>({
            ...wheelZoomViewportTransitionOptions,
            from, to,
            apply: vp => intermediate$.next(vp),
            complete: () => intermediate$.complete()
        })
        transitionTimerSubscription(transition.start(), wheelZoomViewportTransitionTargetFps)
        viewportIntermediate$.next(intermediate$)
        viewportTransition$.next(transition)
    })

wheelZoomViewport$
    .pipe(
        withLatestTickingTransition(),
    )
    .subscribe(([to, transition]) => {
        transition.revise({
            ...wheelZoomViewportTransitionOptions,
            to,
        })
    })
continuousViewport$
    .pipe(
        withLatestTickingTransition(),
    )
    .subscribe(([_, transition]) => {
        transition.complete()
    })

const smoothenedViewport$ = viewportIntermediate$
    .pipe(switchMap(_ => _))
//#endregion

//#region Viewport Update
const allViewport$: Observable<Viewport> =
    merge(
        continuousViewport$,
        smoothenedViewport$,
    )
allViewport$
    .subscribe(viewport$)
//#endregion
