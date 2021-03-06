import { InteractionEvent } from "pixi.js"
import { animationFrameScheduler, distinctUntilChanged, filter, fromEvent, map, mapTo, mergeWith, MonoTypeOperatorFunction, Observable, Observer, OperatorFunction, pairwise, partition, scan, SchedulerLike, share, startWith, Subject, Subscription, switchMap, takeWhile, timer, window, withLatestFrom } from "rxjs"
import { HasEventTargetAddRemove, JQueryStyleEventEmitter, NodeCompatibleEventEmitter, NodeStyleEventEmitter } from "rxjs/internal/observable/fromEvent"
import { EventButtonType } from "../type/event"
import { PlaneVector, Viewport } from "../type/geometry"
import { Transition } from "./transition"

//#region General Filtering
type UnwrappedObservableTuple<T extends Array<Observable<any>>> =
    { [K in keyof T]: T[K] extends Observable<infer V> ? V : never }
export const filterWithMultipleLatestFrom =
    <F extends Array<Observable<any>>>(...targets: F) =>
        (predicate: (value: UnwrappedObservableTuple<F>) => boolean) =>
            <T>(ob: Observable<T>) => ob.pipe(
                withLatestFrom(...targets),
                filter(([_, ...latestes]) => predicate(latestes as unknown as UnwrappedObservableTuple<F>)),
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
export function filterByLatestSignal<T>(signal: Observable<boolean>): MonoTypeOperatorFunction<T> {
    return filterWithLatestFrom<boolean, T>(signal, s => s)
}
export function filterByLatestSignalReversed<T>(signal: Observable<boolean>) {
    return filterWithLatestFrom<boolean, T>(signal, s => !s)
}
export function partitionWithLatestFrom<T, F>(
    ob: Observable<F>,
    signal: Observable<T>,
    predicate: (s: T, v: F) => boolean
): [Observable<F>, Observable<F>] {
    return partition(ob.pipe(withLatestFrom(signal)), ([v, s]) => predicate(s, v))
        .map(branch => branch.pipe(map(([v]) => v))) as [Observable<F>, Observable<F>]
}
//#endregion

//#region Specific Filtering
export function filterWithoutTarget(): MonoTypeOperatorFunction<InteractionEvent> {
    return filter(e => !e.currentTarget)
}
export function filterWithTarget(): MonoTypeOperatorFunction<InteractionEvent> {
    return filter(e => e.currentTarget !== undefined && e.currentTarget !== null)
}
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
//#endregion

export function mapToLastestFrom<T, F>(to: Observable<T>): OperatorFunction<F, T> {
    return from => from.pipe(
        withLatestFrom(to),
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

export function scanWithInitializer<T, F>(
    initializer: Observable<F>,
    accumulator: (cumu: F, value: T) => F
): OperatorFunction<T, F> {
    return ob => ob.pipe(
        withLatestFrom(initializer),
        scan<[T, F], F>(
            (cumu: F | undefined, [value, latest]) => cumu === undefined ? latest : accumulator(cumu, value),
            undefined as unknown as F
        ),
    )
}
export function scanInitializedWithLatestFrom<T, F>(
    initializer: Observable<F>,
    accumulator: (cumu: F, value: T) => F
): OperatorFunction<T, F> {
    return ob => ob.pipe(
        window(initializer),
        switchMap(scanWithInitializer(initializer, accumulator))
    )
}

export function windowPairwise<T>(signal: Observable<any>): OperatorFunction<T, [T, T]> {
    return ob => ob.pipe(
        window(signal),
        switchMap(pairwise()),
    )
}
export function windowEachStartWith<T>(signal: Observable<any>, value: T): MonoTypeOperatorFunction<T> {
    return ob => ob.pipe(
        window(signal),
        switchMap(startWith(value)),
    )
}

export function observeEvent<E extends HasEventTargetAddRemove<T> | ArrayLike<HasEventTargetAddRemove<T>>, T>(target: E, eventName: string, observer: Observer<T>): Subscription
export function observeEvent<E extends NodeStyleEventEmitter | ArrayLike<NodeStyleEventEmitter>, T>(target: E, eventName: string, observer: Observer<T>): Subscription
export function observeEvent<E extends NodeCompatibleEventEmitter | ArrayLike<NodeCompatibleEventEmitter>, T>(target: E, eventName: string, observer: Observer<T>): Subscription
export function observeEvent<E extends JQueryStyleEventEmitter<any, T> | ArrayLike<JQueryStyleEventEmitter<any, T>>, T>(target: E, eventName: string, observer: Observer<T>): Subscription
export function observeEvent<T>(target: any, eventName: string, observer: T): Subscription {
    return fromEvent(target, eventName, (e: any) => e).subscribe(observer)
}

export function splitObservable<P, Q>(obs: Observable<[P, Q]>): [Observable<P>, Observable<Q>] {
    const shared = obs.pipe(share())
    return [shared.pipe(map(([p]) => p)), shared.pipe(map(([_, q]) => q))]
}

export function transitionTimer(
    transition: Transition<any>,
    scheduler: SchedulerLike = animationFrameScheduler,
): Observable<number> {
    return timer(0, 0, scheduler)
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
