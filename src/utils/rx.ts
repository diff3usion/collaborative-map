import { filter, fromEvent, map, mapTo, mergeWith, MonoTypeOperatorFunction, Observable, Observer, OperatorFunction, pairwise, partition, scan, share, startWith, Subscription, switchMap, window, withLatestFrom } from "rxjs"
import { HasEventTargetAddRemove, JQueryStyleEventEmitter, NodeCompatibleEventEmitter, NodeStyleEventEmitter } from "rxjs/internal/observable/fromEvent"

//#region Filtering
type UnwrappedObservableTuple<T extends Observable<any>[]> =
    { [K in keyof T]: T[K] extends Observable<infer V> ? V : never }
export const filterWithMultipleLatestFrom =
    <F extends Observable<any>[]>(...targets: F) =>
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

type Projection<T, R> = (value: T, index: number) => R
type UnwrappedProjectionTuple<T, F extends Projection<T, any>[]> =
    { [K in keyof F]: F[K] extends Projection<T, infer V> ? V : never }
export function mapMultiple<T, F extends Projection<T, any>[]>(...projects: F): OperatorFunction<T, UnwrappedProjectionTuple<T, F>> {
    return from => from.pipe(
        map((value, index) => projects.map(p => p(value, index)) as UnwrappedProjectionTuple<T, F>),
    )
}
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
