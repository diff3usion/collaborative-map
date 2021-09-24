import { Ticker, DisplayObject, TickerCallback, Graphics, Container } from "pixi.js"
import { pickProperties } from "."
import { AnimationOptions, PlaneVector } from "../Type"
import { Transition, TransitionRevisionOptions, TransitionOptions, linear, TransitionProcess } from "./transition"

export abstract class AnimatedGraphics<T> {
    public graphics: Graphics = new Graphics()
    public positionTransition?: TransitionTicker<PlaneVector>
    public visibilityTransition?: TransitionTicker<number>

    protected abstract appearProcess(animation: AnimationOptions): TransitionProcess<number>
    protected abstract disappearProcess(animation: AnimationOptions): TransitionProcess<number>

    protected appear(animation?: AnimationOptions) {
        this.graphics.alpha = 0
        this.container.addChild(this.graphics)
        if (animation) {
            this.visibilityTransition = new TransitionTicker(Ticker.shared, {
                ...this.appearProcess(animation),
                apply: a => { this.graphics.alpha = a },
                complete: () => { this.visibilityTransition = undefined },
            }).start()
        } else {
            this.graphics.alpha = 0.5
        }
    }
    protected disappear(animation?: AnimationOptions) {
        const complete = () => {
            this.container.removeChild(this.graphics)
            this.graphics.destroy()
        }
        if (animation) {
            const disappearTransitionOptions = {
                ...this.disappearProcess(animation),
                apply: (a: number) => { this.graphics.alpha = a },
                complete
            }
            if (this.visibilityTransition) {
                this.visibilityTransition.revise(pickProperties(disappearTransitionOptions, 'duration', 'to', 'complete'))
            } else {
                this.visibilityTransition = new TransitionTicker(Ticker.shared, disappearTransitionOptions).start()
            }
        } else {
            this.visibilityTransition?.stop()
            this.positionTransition?.stop()
            complete()
        }
    }

    protected abstract move(animation?: AnimationOptions, from?: PlaneVector): void
    protected abstract draw(): void

    public add(animation?: AnimationOptions): this {
        this.move()
        this.draw()
        this.appear(animation)
        return this
    }
    public abstract update(data: T, animation?: AnimationOptions): this
    public remove(animation?: AnimationOptions) {
        if (this.positionTransition) {
            this.positionTransition.revise({
                complete: () => this.disappear(animation)
            })
        } else {
            this.disappear(animation)
        }
    }

    public constructor(
        public container: Container,
    ) { }
}

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
        this.callback = deltaFrame => this.transition.tick(deltaFrame * this.ticker.FPS)
        this.ticker.add(this.callback)
        return this
    }

    public stop(): void {
        if (this.callback)
            this.ticker.remove(this.callback)
        this.callback = undefined
    }

    public revise(options: TransitionRevisionOptions<T>): void {
        if (this.callback) {
            Object.assign(this.options, options)
            delete options.complete
            this.transition.revise({ ...options })
        }
    }
}
