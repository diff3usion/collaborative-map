import { useEffect, useState, useMemo, RefObject, useRef, useCallback } from "react"
import { Observable, BehaviorSubject, Observer, fromEvent } from "rxjs"
import { HasEventTargetAddRemove, JQueryStyleEventEmitter, NodeCompatibleEventEmitter, NodeStyleEventEmitter } from "rxjs/internal/observable/fromEvent"
import { observeEvent } from "./rx"

export const useObservable
    = <T>(observable: Observable<T>, onNext: (value: T) => void) =>
        useEffect(() => {
            const subscription = observable.subscribe(onNext)
            return () => subscription.unsubscribe()
        }, [])

export const useObservableAsState
    = <T>(subject: Observable<T>, defaultValue: T) => {
        const [value, setValue] = useState<T>(defaultValue)
        useObservable(subject, setValue)
        return value
    }

export const useBehaviorSubjectAsState
    = <T>(subject: BehaviorSubject<T>) =>
        useObservableAsState(subject, subject.getValue())

export const useObservedCallback = <T>(observer: Observer<T>) =>
    useMemo(() => (v: T) => observer.next(v), [])

export const useObservedArrayCallback = <T extends any[]>(observer: Observer<T>) =>
    useMemo(() => (...v: T) => observer.next(v), [])

export function useEventObserver<E extends HasEventTargetAddRemove<T> | ArrayLike<HasEventTargetAddRemove<T>>, T>(target: E, eventName: string, observer: Observer<T>): void
export function useEventObserver<E extends NodeStyleEventEmitter | ArrayLike<NodeStyleEventEmitter>, T>(target: E, eventName: string, observer: Observer<T>): void
export function useEventObserver<E extends NodeCompatibleEventEmitter | ArrayLike<NodeCompatibleEventEmitter>, T>(target: E, eventName: string, observer: Observer<T>): void
export function useEventObserver<E extends JQueryStyleEventEmitter<any, T> | ArrayLike<JQueryStyleEventEmitter<any, T>>, T>(target: E, eventName: string, observer: Observer<T>): void
export function useEventObserver<T>(target: any, eventName: string, observer: Observer<T>) {
    useEffect(() => {
        const subscription = observeEvent(target, eventName, observer)
        return () => subscription.unsubscribe()
    }, [])
}

export const useEventObservedCallback
    = <E extends HTMLElement, T>(eventName: string, observer: Observer<T>) =>
        useCallback<(e: E) => void>(node => fromEvent<T>(node, eventName).subscribe(observer), [])

export const useMultipleEventObservedCallback
    = <E extends HTMLElement, T>(...pairs: [string, Observer<T>][]) =>
        useCallback<(e: E) => void>(node => {
            pairs.forEach(([eventName, observer]) => fromEvent<T>(node, eventName).subscribe(observer))
        }, [])

export const useResizeObserver
    = <E extends HTMLElement>(ref: RefObject<E>, observer: Observer<ResizeObserverEntry>) => {
        useEffect(() => {
            const resizeObserver = new ResizeObserver(e => observer.next(e[0]))
            resizeObserver.observe(ref.current!);
            return () => resizeObserver.disconnect()
        }, [])
    }

export const useResizeObservedRef
    = <E extends HTMLElement>(observer: Observer<ResizeObserverEntry>) => {
        const ref = useRef<E>(null)
        useResizeObserver(ref, observer)
        return ref
    }

