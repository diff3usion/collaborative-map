import { boundedNumber } from "."
import { NumTuple } from "../Type"

export type TransitionFunction<T> = (from: T, to: T, t: number) => T

export const linear = (from: number, to: number, t: number) =>
    from + (to - from) * boundedNumber(0, 1, t)

export function vectorTransition<V extends NumTuple<number>>(transition: TransitionFunction<number>): TransitionFunction<V> {
    return (from: V, to: V, t: number) => from.map((n, i) => transition(n, to[i], t)) as V
}

export function vectorArrayTransition<V extends Array<NumTuple<number>>>(transition: TransitionFunction<number>): TransitionFunction<V> {
    return (from: V, to: V, t: number) => from.map((vector, i) => vector.map((n, j) => transition(n, to[i][j], t))) as V
}

export type TransitionOptions<T> = {
    duration: number
    from: T
    to: T
    fn: TransitionFunction<T>
    apply: (current: T) => void
    complete?: () => void
}
export type RevisedTransitionOptions<T> = Omit<Partial<TransitionOptions<T>>, 'from' | 'apply'>
export type TransitionState<T> = {
    time: number
    current?: T
}
export class Transition<T> {
    private _state: TransitionState<T> = { time: 0 }

    public constructor(
        private _options: TransitionOptions<T>
    ) { }

    public get options(): Readonly<TransitionOptions<T>> {
        return this._options
    }
    public get state(): Readonly<TransitionState<T>> {
        return this._state
    }

    public reset = () => {
        this._state.time = 0
        this.tick(0)
    }

    public revise = (options: RevisedTransitionOptions<T>) => {
        if (this.state.current) {
            this._options.from = this.state.current
            this._options.duration -= this.state.time
            Object.assign(this._options, options)
            this.reset()
        }
    }

    public tick = (dt: number) => {
        const { duration, from, to, fn, apply, complete } = this.options
        const time = boundedNumber(0, duration, this._state.time + dt)
        const current = fn(from, to, time / duration)
        this._state = { time, current }
        apply(current)
        if (complete && time === duration) complete()
    }
}