import { InteractionEvent } from "pixi.js"
import { Observer, throttleTime, share, Subject, tap } from "rxjs"

const canvasContextMenuSubject = new Subject<MouseEvent>()
export const canvasContextMenuObserver: Observer<MouseEvent> = canvasContextMenuSubject
canvasContextMenuSubject.subscribe(e => e.preventDefault())
export const canvasContextMenu$ = canvasContextMenuSubject

const canvasWheelSubject = new Subject<WheelEvent>()
export const canvasWheelObserver: Observer<WheelEvent> = canvasWheelSubject
canvasWheelSubject.subscribe(e => e.preventDefault())
export const canvasWheel$ = canvasWheelSubject.pipe(
    throttleTime(100),
)

export const rendererPointerDown$: Subject<InteractionEvent> = new Subject()
export const rendererPointerUp$: Subject<InteractionEvent> = new Subject()
export const rendererPointerUpOutside$: Subject<InteractionEvent> = new Subject()
export const rendererPointerMove$: Subject<InteractionEvent> = new Subject()

