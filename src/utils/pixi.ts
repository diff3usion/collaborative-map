import { InteractionEvent, Point, Ticker, TickerCallback } from "pixi.js";
import { MonoTypeOperatorFunction, filter } from "rxjs";
import { PlaneVector } from "../type/plane";
import { Transition, TransitionData, TransitionRevisedData } from "./transition";

export const pointToVector: (p: Point) => PlaneVector
    = p => [p.x, p.y]

export const eventToGlobalPosition: (e: InteractionEvent) => PlaneVector
    = ({ data: { global: { x, y } } }) => [x, y]

export const eventToTargetRelativePosition: (e: InteractionEvent) => PlaneVector
    = ({ currentTarget: { position: { x, y } } }) => [x, y]

export function filterWithoutTarget(): MonoTypeOperatorFunction<InteractionEvent> {
    return filter(e => !e.currentTarget)
}
export function filterWithTarget(): MonoTypeOperatorFunction<InteractionEvent> {
    return filter(e => e.currentTarget !== undefined && e.currentTarget !== null)
}

export class TransitionTicker<T> {
    private callback?: TickerCallback<any>
    private _complete = () => {
        this.stop()
        if (this.options.complete) this.options.complete()
    }

    public constructor(
        private ticker: Ticker,
        private options: TransitionData<T>,
    ) {
        this.transition = new Transition({ ...options, complete: this._complete.bind(this) })
    }

    public transition: Transition<T>

    public start(): this {
        this.stop()
        // this.transition.reset();
        this.callback = deltaFrame => this.transition.tick(deltaFrame * this.ticker.FPS)
        this.ticker.add(this.callback)
        return this
    }

    public stop(): void {
        if (this.callback)
            this.ticker.remove(this.callback)
        this.callback = undefined
    }

    public revise(options: TransitionRevisedData<T>): void {
        if (this.callback) {
            Object.assign(this.options, options)
            delete options.complete
            this.transition.revise({ ...options })
        }
    }
}
