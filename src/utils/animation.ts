import { Ticker, DisplayObject, TickerCallback } from "pixi.js"
import { boundedNumber } from "."
import { NumTuple, PlaneVector } from "../Type"

export type TransitionFunction<T> = (from: T, to: T, t: number) => T

export const linear = (from: number, to: number, t: number) =>
    from + (to - from) * boundedNumber(0, 1, t)

export const vectorTransition = <V extends NumTuple<number>>(transition: TransitionFunction<number>) =>
    ((from: V, to: V, t: number) => from.map((n, i) => transition(n, to[i], t))) as TransitionFunction<V>

export const vectorArrayTransition = <V extends NumTuple<number>>(transition: TransitionFunction<number>) =>
    ((from: V[], to: V[], t: number) => from.map((vector, i) => vector.map((n, j) => transition(n, to[i][j], t)))) as TransitionFunction<V[]>

export class Transition<T> {
    private time = 0
    private current?: T
    private callback?: TickerCallback<any>
    private tick = (delta: number) => {
        this.time += delta
        this.current = this.transition(this.from, this.to, this.time / this.duration)
        this.apply(this.current)
        if (this.time >= this.duration) this.complete()
    }

    private complete = () => {
        this.stop()
        if (this.onComplete) this.onComplete()
        return this
    }

    constructor(
        private duration: number,
        private from: T,
        private to: T,
        private apply: (value: T) => void,
        private transition: TransitionFunction<T>,
        private onComplete?: () => void
    ) { }

    public stop = () => {
        if (this.callback)
            Ticker.shared.remove(this.callback)
        this.callback = undefined
        return this
    }

    public start = () => {
        this.stop()
        this.time = 0
        this.callback = this.tick.bind(this)
        Ticker.shared.add(this.callback)
        return this
    }

    public revise = (to: T, duration?: number) => {
        if (this.callback) {
            this.time = 0
            this.from = this.current!
            this.to = to
            this.duration = duration ? duration : this.duration - this.time
        }
        return this
    }
}

export const transitionPosition: (duration: number, target: DisplayObject, from: PlaneVector, to: PlaneVector, onComplete?: () => void) => Transition<PlaneVector>
    = (duration, target, from, to, onComplete) =>
        new Transition(duration, from, to, v => target?.position.set(...v), vectorTransition(linear), onComplete)

export const transitionScale: (duration: number, target: DisplayObject, from: number, to: number, onComplete?: () => void) => Transition<number>
    = (duration, target, from, to, onComplete) =>
        new Transition(duration, from, to, s => target.scale.set(s), linear, onComplete)

