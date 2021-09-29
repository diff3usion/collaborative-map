import { numberBounded } from "."
import { AnimationOptions, NumTuple, Viewport } from "../Type"

export type TransitionFn<T> = (from: T, to: T, t: number) => T
export type TransitionFunction = TransitionFn<number>

export const linear = (from: number, to: number, t: number) =>
    from + (to - from) * numberBounded(0, 1, t)

export function transitionObject<T extends Object>(
    fns: { [K in keyof T]: TransitionFn<T[K]> },
): TransitionFn<T> {
    return (from: T, to: T, t: number) =>
        (Object.keys(from) as (keyof T)[]).reduce((obj: T, key: keyof T) => {
            obj[key] = fns[key](from[key], to[key], t)
            return obj
        }, { ...from })
}
export function transitionArray<T>(
    fn: TransitionFn<T>,
): TransitionFn<T[]> {
    return (from: T[], to: T[], t: number) => from.map((n, i) => fn(n, to[i], t))
}
export function transition2dArray<T>(
    fn: TransitionFn<T>,
): TransitionFn<T[][]> {
    return (from: T[][], to: T[][], t: number) => from.map((vector, i) => vector.map((n, j) => fn(n, to[i][j], t)))
}
export const transitionVector
    = transitionArray as <V extends NumTuple<number>>(fn: TransitionFunction) => TransitionFn<V>
export function transitionViewport(
    fn: TransitionFunction
): TransitionFn<Viewport> {
    return transitionObject<Viewport>({ position: transitionVector(fn), scale: fn })
}

export type TransitionOptions<T> = AnimationOptions & {
    fn: TransitionFn<T>
}
export type TransitionPath<T> = {
    from: T
    to: T
}
export type TransitionAction<T> = {
    apply: (current: T) => void
    complete?: () => void
}
export type TransitionData<T> = TransitionOptions<T> & TransitionPath<T> & TransitionAction<T>
export type TransitionRevisedData<T> = Partial<Omit<TransitionData<T>, 'from' | 'apply'>>
export type TransitionState<T> = {
    started: boolean
    completed: boolean
    time: number
    current?: T
}

const initTransitionState = () => ({
    time: 0,
    started: false,
    completed: false
})
export class Transition<T> {
    private _state: TransitionState<T> = initTransitionState()
    private reset() {
        this._state = initTransitionState()
    }

    public constructor(
        private _options: TransitionData<T>
    ) { }
    public get options(): Readonly<TransitionData<T>> {
        return this._options
    }
    public get state(): Readonly<TransitionState<T>> {
        return this._state
    }
    public get started(): boolean {
        return this.state.started
    }
    public get completed(): boolean {
        return this.state.completed
    }
    public get ticking(): boolean {
        return this.started && !this.completed
    }
    public start(): this {
        if (!this._state.completed) {
            this._state.started = true
        }
        return this
    }
    public revise(options: TransitionRevisedData<T>): this {
        if (this.ticking) {
            this._options.from = this.state.current ? this.state.current : this.options.from
            this._options.duration -= this.state.time
            Object.assign(this._options, options)
            this.reset()
            this.start()
        }
        return this
    }
    public complete() {
        this._state.completed = true
        this._state.current = undefined
        if (this.options.complete) this.options.complete()
    }
    public tick(dt: number): this {
        if (this.ticking) {
            const { duration, from, to, fn, apply } = this.options
            const time = numberBounded(0, duration, this._state.time + dt)
            const current = fn(from, to, time / duration)
            this._state = { ...this._state, time, current }
            apply(current)
            if (time === duration) {
                this.complete()
            }
        }
        return this
    }
}
