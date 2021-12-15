import { map, withLatestFrom, switchMap, tap, filter, pairwise, merge, Observable, OperatorFunction, Subject, startWith, share, MonoTypeOperatorFunction } from "rxjs"
import { eventToPosition } from "../utils/event"
import { scaleWithFixedPoint } from "../utils/geometry"
import { twoNumbersSameSign, numberBounded, vectorDist, vectorMean, vectorNorm, vectorSubtract } from "../utils/math"
import { filterWithLatestFrom, windowPairwise } from "../utils/rx"
import { linear, Transition, transitionViewport, TransitionOptions, transitionObservable, transitionObserver, transitionTimer } from "../utils/transition"

import { canvasWheel$, canvasPointerMove$, mainButtonDown$, canvasTwoFingerGesture$ } from "../intent/Map"
import { viewport$, scale$, filterSinglePointerIsDown } from "../store/Map"
import { filterIsExploreMode } from "../store/MapExplore"
import { PlaneVector } from "../type/plane"
import { Viewport } from "../type/viewport"
import { distinctViewport } from "../utils/viewport"
import { distinctPlaneVector } from "../utils/plane"

const maxScale = 64
const minScale = 1 / 8

function initViewport(position: PlaneVector, scale: number): Viewport {
    return { position, scale }
}

//#region Pan Action
type PanData = {
    from: PlaneVector
    to: PlaneVector
}
const pinchPanData$: Observable<PanData> = canvasTwoFingerGesture$
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
        map(({ from, to }) => vectorSubtract(to, from)),
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
const pinchZoomData$: Observable<ZoomData> = canvasTwoFingerGesture$
    .pipe(
        map(([[prev0, prev1], [curr0, curr1]]) => ({
            level: vectorDist(curr0, curr1) / vectorDist(prev0, prev1),
            center: vectorMean(curr0, curr1),
        }))
    )
const wheelZoomData$: Observable<ZoomData> = canvasWheel$
    .pipe(
        filterIsExploreMode(),
        withWheelZoomLevelMultiplier(),
        map(([event, multiplier]) => ({
            level: numberBounded(0.5, 2, 1 + event.deltaY * multiplier),
            center: eventToPosition(event),
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
const continuousViewport$: Observable<Viewport> =
    merge(
        pointerPanViewport$,
        pinchPanViewport$,
        pinchZoomViewport$,
    )
continuousViewport$
    .pipe(
        withLatestTickingTransition(),
    )
    .subscribe(([_, transition]) => {
        transition.complete()
    })

const wheelZoomViewportTransitionOptions: TransitionOptions<Viewport> = {
    duration: 200,
    fn: transitionViewport(linear),
}
const wheelZoomViewportTransition$ = wheelZoomViewport$
    .pipe(
        filterLatestTransitionNotTicking(),
        withLatestFrom(viewport$),
        map(([to, from]) => new Transition<Viewport>({
            ...wheelZoomViewportTransitionOptions,
            from, to,
            apply: () => { }
        })),
        tap(transition => transitionTimer(transition.start())
            .subscribe(transitionObserver(transition))),
        share(),
    )
wheelZoomViewportTransition$
    .subscribe(viewportTransition$)
wheelZoomViewportTransition$
    .pipe(
        map(transitionObservable),
    )
    .subscribe(viewportIntermediate$)
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
    .pipe(
        startWith<Viewport>({ position: [0, 0], scale: 1 }),
    )
    .subscribe(viewport$)
//#endregion
