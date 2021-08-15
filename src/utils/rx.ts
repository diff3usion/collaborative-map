import { InteractionEvent } from "pixi.js"
import { distinctUntilChanged, filter, fromEvent, map, Observable, Observer, Subscription, withLatestFrom } from "rxjs"
import { HasEventTargetAddRemove, JQueryStyleEventEmitter, NodeCompatibleEventEmitter, NodeStyleEventEmitter } from "rxjs/internal/observable/fromEvent"
import { EventButtonType, PlaneVector, Viewport } from "../Type"

export const filterWithoutTarget = () => filter((e: InteractionEvent) => !e.currentTarget)
export const filterWithTarget = () => filter((e: InteractionEvent) => e.currentTarget !== undefined && e.currentTarget !== null)

export const filterEventButton: (...acceptable: EventButtonType[]) => (ob: Observable<InteractionEvent>) => Observable<InteractionEvent>
    = (...acceptable: EventButtonType[]) =>
        filter((e: InteractionEvent) => acceptable.includes(e.data.button))

export const distinctPlaneVector = () =>
    distinctUntilChanged<PlaneVector>(([prevX, prevY], [x, y]) =>
        prevX === x && prevY === y)
export const distinctViewport = () =>
    distinctUntilChanged<Viewport>(({ position: [prevX, prevY], scale: prevScale }, { position: [x, y], scale }) =>
        prevX === x && prevY === y && prevScale === scale)

export const switchToLastestFrom = <T, F>(o: Observable<T>) => (original: Observable<F>) => original.pipe(withLatestFrom(o), map(([_, v]) => v))

export function observeEvent<E extends HasEventTargetAddRemove<T> | ArrayLike<HasEventTargetAddRemove<T>>, T>(target: E, eventName: string, observer: Observer<T>): Subscription
export function observeEvent<E extends NodeStyleEventEmitter | ArrayLike<NodeStyleEventEmitter>, T>(target: E, eventName: string, observer: Observer<T>): Subscription
export function observeEvent<E extends NodeCompatibleEventEmitter | ArrayLike<NodeCompatibleEventEmitter>, T>(target: E, eventName: string, observer: Observer<T>): Subscription
export function observeEvent<E extends JQueryStyleEventEmitter<any, T> | ArrayLike<JQueryStyleEventEmitter<any, T>>, T>(target: E, eventName: string, observer: Observer<T>): Subscription
export function observeEvent<T>(target: any, eventName: string, observer: T): Subscription {
    return fromEvent(target, eventName, (e: any) => e).subscribe(observer)
}
