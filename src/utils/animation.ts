import { Ticker, DisplayObject, TickerCallback } from "pixi.js"
import { PlaneVector } from "../Type"
import { Transition, RevisedTransitionOptions, TransitionOptions } from "./transition"

export class TransitionTicker<T> {
    private callback?: TickerCallback<any>
    private _complete = () => {
        this.stop()
        if (this.options.complete) this.options.complete()
    }

    public constructor(
        private ticker: Ticker,
        private options: TransitionOptions<T>,
    ) {
        this.transition = new Transition({ ...options, complete: this._complete.bind(this) })
    }

    public transition: Transition<T>

    public start(): this {
        this.stop()
        this.transition.reset();
        this.callback = this.transition.tick.bind(this.transition)
        this.ticker.add(this.callback)
        return this
    }

    public stop(): void {
        if (this.callback)
            this.ticker.remove(this.callback)
        this.callback = undefined
    }

    public revise(options: RevisedTransitionOptions<T>): void {
        if (this.callback) {
            Object.assign(this.options, options)
            delete options.complete
            this.transition.revise({ ...options })
        }
    }
}

export function transitionPosition(
    target: DisplayObject,
    options: Omit<TransitionOptions<PlaneVector>, 'apply'>
): TransitionTicker<PlaneVector> {
    return new TransitionTicker(Ticker.shared, { ...options, apply: p => target.position.set(...p) })
}

export function transitionScale(
    target: DisplayObject,
    options: Omit<TransitionOptions<number>, 'apply'>
): TransitionTicker<number> {
    return new TransitionTicker(Ticker.shared, { ...options, apply: s => target.scale.set(s) })
}
