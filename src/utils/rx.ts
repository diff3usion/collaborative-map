import { InteractionEvent } from "pixi.js"
import { distinctUntilChanged, filter, fromEvent, map, mapTo, mergeWith, MonoTypeOperatorFunction, Observable, Observer, OperatorFunction, pairwise, Subscription, withLatestFrom } from "rxjs"
import { HasEventTargetAddRemove, JQueryStyleEventEmitter, NodeCompatibleEventEmitter, NodeStyleEventEmitter } from "rxjs/internal/observable/fromEvent"
import { EventButtonType, PlaneVector, Viewport } from "../Type"

type ExtractObservableArray<T extends Array<Observable<any>>> =
    { [K in keyof T]: T[K] extends Observable<infer V> ? V : never }
export const filterWithMultipleLatestFrom =
    <F extends Array<Observable<any>>>(...targets: F) =>
        (predicate: (value: ExtractObservableArray<F>) => boolean) =>
            <T>(ob: Observable<T>) => ob.pipe(
                withLatestFrom(...targets),
                filter(([_, ...latestes]) => predicate(latestes as unknown as ExtractObservableArray<F>)),
                map(([v]) => v)
            )

export const filterThatLatestEquals = <F>(target$: Observable<F>) => (value: F) =>
    filterWithMultipleLatestFrom(target$)(([latest]) => latest === value)

export function filterWithLatestFrom<T, F>(signal: Observable<T>, predicate: (v: F, s: T) => boolean): MonoTypeOperatorFunction<F> {
    return ob => ob.pipe(
        withLatestFrom(signal),
        filter(([v, s]) => predicate(v, s)),
        map(([v]) => v)
    )
}

export const filterByLatestBoolean = <T>(signal: Observable<boolean>) =>
    filterWithLatestFrom(signal, (_: T, s: boolean) => s)

export const filterWithoutTarget = () => filter((e: InteractionEvent) => !e.currentTarget)
export const filterWithTarget = () => filter((e: InteractionEvent) => e.currentTarget !== undefined && e.currentTarget !== null)

export function filterEventButton(...acceptable: EventButtonType[]): MonoTypeOperatorFunction<InteractionEvent> {
    return filter((e: InteractionEvent) => acceptable.includes(e.data.button))
}

export function distinctPlaneVector(): MonoTypeOperatorFunction<PlaneVector> {
    return distinctUntilChanged<PlaneVector>(([prevX, prevY], [x, y]) =>
        prevX === x && prevY === y)
}
export function distinctViewport(): MonoTypeOperatorFunction<Viewport> {
    return distinctUntilChanged<Viewport>(({ position: [prevX, prevY], scale: prevScale }, { position: [x, y], scale }) =>
        prevX === x && prevY === y && prevScale === scale)
}
export function pairwiseDeltaPlaneVector(): MonoTypeOperatorFunction<PlaneVector> {
    return ob => ob.pipe(
        pairwise(),
        map(([[x0, y0], [x1, y1]]) => [x1 - x0, y1 - y0]),
    )
}
export function switchToLastestFrom<T, F>(to: Observable<T>): OperatorFunction<F, T> {
    return from => from.pipe(
        withLatestFrom(to),
        map(([_, v]) => v)
    )
}

export function mergeWithSignalAs<T, F, G>(signal: Observable<T>, target: F): MonoTypeOperatorFunction<F | G> {
    return mergeWith(signal.pipe(mapTo(target)))
}

export function observeEvent<E extends HasEventTargetAddRemove<T> | ArrayLike<HasEventTargetAddRemove<T>>, T>(target: E, eventName: string, observer: Observer<T>): Subscription
export function observeEvent<E extends NodeStyleEventEmitter | ArrayLike<NodeStyleEventEmitter>, T>(target: E, eventName: string, observer: Observer<T>): Subscription
export function observeEvent<E extends NodeCompatibleEventEmitter | ArrayLike<NodeCompatibleEventEmitter>, T>(target: E, eventName: string, observer: Observer<T>): Subscription
export function observeEvent<E extends JQueryStyleEventEmitter<any, T> | ArrayLike<JQueryStyleEventEmitter<any, T>>, T>(target: E, eventName: string, observer: Observer<T>): Subscription
export function observeEvent<T>(target: any, eventName: string, observer: T): Subscription {
    return fromEvent(target, eventName, (e: any) => e).subscribe(observer)
}

export const mapToAndObserveWith = <T, F>(target: F, observer: Observer<F>) =>
    (_: T) => observer.next(target)

export const mapAndObserveWith = <T, F>(fn: (event: T) => F, observer: Observer<F>) =>
    (event: T) => observer.next(fn(event))

export const observeWith = <T>(observer: Observer<T>) =>
    (event: T) => observer.next(event)
