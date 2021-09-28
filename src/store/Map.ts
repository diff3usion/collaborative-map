import { BehaviorSubject, combineLatest, combineLatestWith, distinctUntilChanged, map, MonoTypeOperatorFunction, Observable, Observer, OperatorFunction, pairwise, shareReplay, Subject, withLatestFrom } from "rxjs"

import { EventButtonType, PlaneAxis, PlaneRect, PlaneVector, SizedViewport, Viewport, ViewportUpdate } from "../Type"
import { distinctPlaneVector, filterWithLatestFrom } from "../utils/rx"
import { globalToRelativePosition, relativeToGlobalPosition } from "../utils"
import { mainPanelSize$ } from "../intent/MainPanel"
import { divideRectByHalf, rectCenter, scaleToFitRectIn, scaleWithMovingPoint, vectorTimes } from "../utils/geometry"

const viewportUpdateSubject = new BehaviorSubject<ViewportUpdate>({ viewport: { position: [0, 0], scale: 1 } })
export const viewportUpdateObserver: Observer<ViewportUpdate> = viewportUpdateSubject
export const viewportUpdate$ = viewportUpdateSubject
    .pipe(
        shareReplay(1)
    )

export const viewport$ = viewportUpdate$.pipe(map(({ viewport }) => viewport))
export const sizedViewport$: Observable<SizedViewport> = mainPanelSize$
    .pipe(
        combineLatestWith(viewport$),
        map(([size, viewport]) => ({ size, viewport }))
    )

export const position$ = viewport$
    .pipe(
        map(({ position }) => position),
        distinctPlaneVector(),
    )
export const scale$ = viewport$
    .pipe(
        map(({ scale }) => scale),
        distinctUntilChanged(),
    )
export const canvasPointersCurrentlyDown$ = new BehaviorSubject<PointerEvent[]>([])
export const canvasSinglePointerDown$ = canvasPointersCurrentlyDown$
    .pipe(
        map(down => down.length === 1 ? down[0] : undefined)
    )

export const rendererCursorStyle$ = new BehaviorSubject<string>('grab')
export const cursorRelativePosition$ = new BehaviorSubject<PlaneVector>([0, 0])
export const cursorRoundedRelativePosition$ = new BehaviorSubject<PlaneVector>([0, 0])

export function filterSinglePointerIsDown<T>(...acceptable: EventButtonType[]): MonoTypeOperatorFunction<T> {
    return filterWithLatestFrom(
        canvasSinglePointerDown$,
        down => down !== undefined && (!acceptable.length || acceptable.includes(down.button))
    )
}

export function filterPointerDownCount<T>(count: number): MonoTypeOperatorFunction<T> {
    return filterWithLatestFrom(
        canvasPointersCurrentlyDown$,
        c => c.length === count
    )
}

export function mapToRelativePosition(): MonoTypeOperatorFunction<PlaneVector> {
    return ob => ob.pipe(
        withLatestFrom(viewport$),
        map(args => globalToRelativePosition(...args)),
    )
}
export function mapToGlobalPosition(): MonoTypeOperatorFunction<PlaneVector> {
    return ob => ob.pipe(
        withLatestFrom(viewport$),
        map(args => relativeToGlobalPosition(...args)),
    )
}

export function viewportFocusRect(): OperatorFunction<PlaneRect, Viewport> {
    return ob => ob.pipe(
        withLatestFrom(viewport$, mainPanelSize$),
        map(([rect, viewport, size]) => {
            const globalRect = [relativeToGlobalPosition(rect[0], viewport), vectorTimes(viewport.scale, rect[1])] as PlaneRect
            const displayRect = divideRectByHalf([[0, 0], size], PlaneAxis.X)[1]
            const scale = scaleToFitRectIn(globalRect, displayRect[1])
            const transformation = scaleWithMovingPoint(scale, rectCenter(globalRect), rectCenter(displayRect))
            return {
                position: transformation(viewport.position),
                scale: scale * viewport.scale,
            }
        })
    )
}
