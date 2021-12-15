import { BehaviorSubject, combineLatestWith, distinctUntilChanged, map, MonoTypeOperatorFunction, Observable, OperatorFunction, startWith, Subject, withLatestFrom } from "rxjs"
import { canvasSize$ } from "../intent/Map"
import { EventButtonType } from "../type/event"
import { PlaneAxis, PlaneRect, PlaneVector } from '../type/plane'
import { SizedViewport, Viewport } from "../type/viewport"
import { mapInitPluck } from "../utils/collection"
import { globalToRelativePosition, relativeToGlobalPosition } from "../utils/event"
import { divideRectByHalf, rectCenter, scaleToFitRectIn, scaleWithMovingPoint } from "../utils/geometry"
import { vectorScale } from "../utils/math"
import { distinctPlaneVector } from "../utils/plane"
import { filterWithLatestFrom, mapMultiple } from "../utils/rx"
import { viewportInverseTransformation, viewportTransformation } from "../utils/viewport"

//#region Viewport and Size
export const viewport$ = new Subject<Viewport>()
export const sizedViewport$ = viewport$
    .pipe(
        combineLatestWith(canvasSize$),
        map(([viewport, size]) => <SizedViewport>({ size, viewport }))
    )
export const viewportTransformation$ = viewport$
    .pipe(
        mapMultiple(viewportTransformation, viewportInverseTransformation),
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
//#region 

export const rendererCursorStyle$ = new BehaviorSubject<string>('grab')
export const cursorRelativePosition$ = new BehaviorSubject<PlaneVector>([0, 0])
export const cursorRoundedRelativePosition$ = new BehaviorSubject<PlaneVector>([0, 0])

//#region Pointer Down
export const canvasPointersCurrentlyDown$ = new BehaviorSubject<PointerEvent[]>([])
export const canvasPointersCurrentlyDownIdMap$ = canvasPointersCurrentlyDown$
    .pipe(
        map(down => mapInitPluck(down, 'pointerId'))
    )
export const canvasPointersDownAndMoved$ = new BehaviorSubject<PointerEvent[]>([])
export const canvasPointersDownAndMovedIdMap$ = canvasPointersDownAndMoved$
    .pipe(
        map(down => mapInitPluck(down, 'pointerId'))
    )
export const canvasSinglePointerDown$ = canvasPointersCurrentlyDown$
    .pipe(
        map(down => down.length === 1 ? down[0] : undefined)
    )
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
//#endregion

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
export function mapToFittedviewport(): OperatorFunction<PlaneRect, Viewport> {
    return ob => ob.pipe(
        withLatestFrom(sizedViewport$),
        map(([rect, { viewport, size }]) => {
            const globalRect = [relativeToGlobalPosition(rect[0], viewport), vectorScale(viewport.scale, rect[1])] as PlaneRect
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
