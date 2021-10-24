import { map, shareReplay, Subject } from "rxjs"
import { EventButtonType } from "../type/event"
import { PlaneVector } from "../type/geometry"
import { distinctPlaneVector, filterEventButton } from "../utils/rx"

export const canvasResizeObserverEntry$: Subject<ResizeObserverEntry> = new Subject()
export const canvasSize$ = canvasResizeObserverEntry$.pipe(
    map(e => <PlaneVector>[e.contentRect.width, e.contentRect.height]),
    distinctPlaneVector(),
    shareReplay(1),
)

export const canvasContextMenu$ = new Subject<MouseEvent>()
export const canvasWheel$ = new Subject<WheelEvent>()
export const canvasPointerMove$: Subject<PointerEvent> = new Subject()
export const canvasPointerDown$: Subject<PointerEvent> = new Subject()
export const canvasPointerUp$: Subject<PointerEvent> = new Subject()
export const canvasPointerUpOutside$ = new Subject<PointerEvent>()

export const canvasMainPointerMove$ = canvasPointerMove$
    .pipe(
        filterEventButton(EventButtonType.Main)
    )
export const mainButtonDown$ = canvasPointerDown$
    .pipe(
        filterEventButton(EventButtonType.Main),
    )
export const canvasMainPointerUp$ = canvasPointerUp$
    .pipe(
        filterEventButton(EventButtonType.Main)
    )

canvasContextMenu$.subscribe(e => e.preventDefault())
canvasWheel$.subscribe(e => e.preventDefault())
canvasPointerUp$.subscribe(e => e.stopPropagation())
