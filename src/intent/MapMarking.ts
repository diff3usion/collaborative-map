import { InteractionEvent } from "pixi.js"
import { Subject } from "rxjs"

export const tempPointPointerUp$ = new Subject<InteractionEvent>()
export const tempPointPointerMove$ = new Subject<InteractionEvent>()
export const tempPointPointerOver$ = new Subject<InteractionEvent>()
export const tempPointPointerOut$ = new Subject<InteractionEvent>()

export const placedPointPointerDown$ = new Subject<InteractionEvent>()
export const placedPointPointerUp$ = new Subject<InteractionEvent>()
export const placedPointPointerMove$ = new Subject<InteractionEvent>()
export const placedPointPointerOver$ = new Subject<InteractionEvent>()
export const placedPointPointerOut$ = new Subject<InteractionEvent>()

export const startPointPointerDown$ = new Subject<InteractionEvent>()
export const startPointPointerUp$ = new Subject<InteractionEvent>()

export const endPointPointerDown$ = new Subject<InteractionEvent>()
export const endPointPointerUp$ = new Subject<InteractionEvent>()
