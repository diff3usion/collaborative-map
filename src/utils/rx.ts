import { InteractionEvent } from "pixi.js"
import { combineLatestWith, distinctUntilChanged, filter, fromEvent, map, mapTo, mergeWith, MonoTypeOperatorFunction, Observable, Observer, OperatorFunction, pairwise, partition, share, startWith, Subject, Subscription, switchMap, take, takeWhile, timer, window, withLatestFrom } from "rxjs"
import { HasEventTargetAddRemove, JQueryStyleEventEmitter, NodeCompatibleEventEmitter, NodeStyleEventEmitter } from "rxjs/internal/observable/fromEvent"
import { EventButtonType, PlaneVector, Viewport } from "../Type"
import { Transition } from "./transition"

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
export function filterWithLatestFrom<T, F>(
    signal: Observable<T>,
    predicate: (s: T, v: F) => boolean
): MonoTypeOperatorFunction<F> {
    return ob => ob.pipe(
        withLatestFrom(signal),
        filter(([v, s]) => predicate(s, v)),
        map(([v]) => v)
    )
}
export const filterByLatestSignal = <T>(signal: Observable<boolean>) =>
    filterWithLatestFrom<boolean, T>(signal, s => s)

export const filterByLatestSignalReversed = <T>(signal: Observable<boolean>) =>
    filterWithLatestFrom<boolean, T>(signal, s => !s)

export function partitionWithLatestFrom<T, F>(
    ob: Observable<F>,
    signal: Observable<T>,
    predicate: (s: T, v: F) => boolean
): [Observable<F>, Observable<F>] {
    return partition(ob.pipe(withLatestFrom(signal)), ([v, s]) => predicate(s, v))
        .map(branch => branch.pipe(map(([v]) => v))) as [Observable<F>, Observable<F>]
}

export const filterWithoutTarget = () => filter((e: InteractionEvent) => !e.currentTarget)
export const filterWithTarget = () => filter((e: InteractionEvent) => e.currentTarget !== undefined && e.currentTarget !== null)

export function filterEventButton(...acceptable: EventButtonType[]): MonoTypeOperatorFunction<PointerEvent> {
    return filter(e => acceptable.includes(e.button))
}
export function filterEventId(id: number): MonoTypeOperatorFunction<PointerEvent> {
    return filter(e => id === e.pointerId)
}

export function distinctPlaneVector(): MonoTypeOperatorFunction<PlaneVector> {
    return distinctUntilChanged<PlaneVector>(([prevX, prevY], [x, y]) =>
        prevX === x && prevY === y)
}
export function distinctViewport(): MonoTypeOperatorFunction<Viewport> {
    return distinctUntilChanged<Viewport>(({ position: [prevX, prevY], scale: prevScale }, { position: [x, y], scale }) =>
        prevX === x && prevY === y && prevScale === scale)
}
export function switchToLastestFrom<T, F>(to: Observable<T>): OperatorFunction<F, T> {
    return from => from.pipe(
        withLatestFrom(to),
        map(([_, v]) => v),
    )
}
export function switchTo<T, F>(to: Observable<T>): OperatorFunction<F, T> {
    return from => from.pipe(
        combineLatestWith(to),
        map(([_, v]) => v),
    )
}
export function mapToOnSignal<T>(to: T, signal: Observable<any>): MonoTypeOperatorFunction<T> {
    return from => from.pipe(
        withLatestFrom(signal),
        mapTo(to),
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

export function windowPairwise<T>(signal: Observable<any>): OperatorFunction<T, [T, T]> {
    return ob => ob.pipe(
        window(signal),
        switchMap(ob => ob.pipe(
            pairwise(),
        )),
    )
}
export function windowEachStartWith<T>(signal: Observable<any>, value: T): MonoTypeOperatorFunction<T> {
    return ob => ob.pipe(
        window(signal),
        switchMap(startWith(value)),
    )
}

export function splitObservable<P, Q>(obs: Observable<[P, Q]>): [Observable<P>, Observable<Q>] {
    const shared = obs.pipe(share())
    return [shared.pipe(map(([p]) => p)), shared.pipe(map(([_, q]) => q))]
}

export function transitionTimer(
    transition: Transition<any>,
    targetFps = 60,
): Observable<number> {
    return timer(0, 1000 / targetFps)
        .pipe(
            takeWhile(() => transition.ticking),
            map(_ => Date.now()),
            pairwise(),
            map(([prevTime, currTime]) => currTime - prevTime),
        )
}

export function transitionObservable<T>(
    transition: Transition<T>,
): Observable<T> {
    const res$ = new Subject<T>()
    const oldApply = transition.options.apply
    const oldComplete = transition.options.complete
    transition.revise({
        apply: value => {
            oldApply(value)
            res$.next(value)
        },
        complete: () => {
            if (oldComplete) oldComplete()
            res$.complete()
        },
    })
    return res$
}

export function transitionObserver(
    transition: Transition<any>,
): Observer<number> {
    return {
        next: transition.tick.bind(transition),
        complete: transition.complete.bind(transition),
        error: console.error
    }
}
