import { useEffect, useState, RefObject, useRef, useCallback } from "react"
import { Observable, BehaviorSubject, Observer, fromEvent } from "rxjs"
import { HasEventTargetAddRemove, JQueryStyleEventEmitter, NodeCompatibleEventEmitter, NodeStyleEventEmitter } from "rxjs/internal/observable/fromEvent"
import { observeEvent } from "./rx"

//#region useObservable
export function useObservable<T>(observable: Observable<T>, onNext: (value: T) => void): void {
    useEffect(() => {
        const subscription = observable.subscribe(onNext)
        return () => subscription.unsubscribe()
    }, [])
}
export function useObservableAsState<T>(
    subject: Observable<T>,
    defaultValue: T,
): T {
    const [value, setValue] = useState<T>(defaultValue)
    useObservable(subject, setValue)
    return value
}
export function useBehaviorSubjectAsState<T>(
    subject: BehaviorSubject<T>,
): T {
    return useObservableAsState(subject, subject.getValue())
}
//#endregion

//#region useObserver
//#region useObservedCallback
export function useObservedCallback<T>(
    observer: Observer<T>,
): (v: T) => void {
    return useCallback(
        v => observer.next(v),
        [],
    )
}
export function useObservedArrayCallback<T extends any[]>(
    observer: Observer<T>,
): (...v: T) => void {
    return useCallback(
        (...v) => observer.next(v),
        [],
    )
}
//#endregion

//#region useEventObserver
export function useEventObserver<E extends HasEventTargetAddRemove<T> | ArrayLike<HasEventTargetAddRemove<T>>, T>(target: () => E, eventName: string, observer: Observer<T>): void
export function useEventObserver<E extends NodeStyleEventEmitter | ArrayLike<NodeStyleEventEmitter>, T>(target: () => E, eventName: string, observer: Observer<T>): void
export function useEventObserver<E extends NodeCompatibleEventEmitter | ArrayLike<NodeCompatibleEventEmitter>, T>(target: () => E, eventName: string, observer: Observer<T>): void
export function useEventObserver<E extends JQueryStyleEventEmitter<any, T> | ArrayLike<JQueryStyleEventEmitter<any, T>>, T>(target: () => E, eventName: string, observer: Observer<T>): void
export function useEventObserver<T>(target: () => any, eventName: string, observer: Observer<T>) {
    useEffect(() => {
        const subscription = observeEvent(target(), eventName, observer)
        return () => subscription.unsubscribe()
    }, [])
}
//#endregion

//#region useEventObservedCallback
export function useEventObservedCallback<E extends HTMLElement, T>(
    eventName: string,
    observer: Observer<T>
): (e: E) => void {
    return useCallback(
        node => fromEvent<T>(node, eventName).subscribe(observer),
        [],
    )
}
export function useMultipleEventsObservedCallback<E extends HTMLElement, EVENT>(
    ...pairs: [string, Observer<EVENT>][]
): (e: E) => void {
    return useCallback(
        node => pairs.forEach(([eventName, observer]) => fromEvent<EVENT>(node, eventName).subscribe(observer)),
        [],
    )
}
//#endregion

//#region useResizeObserver
export function useResizeObserver<E extends HTMLElement>(
    element: () => E,
    observer: Observer<ResizeObserverEntry>
): void {
    useEffect(() => {
        const resizeObserver = new ResizeObserver(e => observer.next(e[0]))
        resizeObserver.observe(element());
        return () => resizeObserver.disconnect()
    }, [])
}
export function useResizeObservedRef<E extends HTMLElement>(
    observer: Observer<ResizeObserverEntry>
): RefObject<E> {
    const ref = useRef<E>(null)
    useResizeObserver(() => ref.current!, observer)
    return ref
}
//#endregion
//#endregion
