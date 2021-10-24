import { BehaviorSubject, distinctUntilChanged, map, MonoTypeOperatorFunction, OperatorFunction, Subject, withLatestFrom } from "rxjs"
import { EventButtonType } from "../type/event"
import { PlaneAxis, PlaneRect, PlaneVector, SizedViewport, Viewport } from "../type/geometry"
import { mapInitPluck } from "../utils/collection"
import { globalToRelativePosition, relativeToGlobalPosition } from "../utils/event"
import { divideRectByHalf, rectCenter, scaleToFitRectIn, scaleWithMovingPoint, vectorTimes } from "../utils/geometry"
import { distinctPlaneVector, filterWithLatestFrom } from "../utils/rx"

//#region Viewport and Size
export const viewport$ = new BehaviorSubject<Viewport>({ position: [0, 0], scale: 1 })
export const sizedViewport$ = new Subject<SizedViewport>()
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
