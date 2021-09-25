import { Text, Ticker, Container } from "pixi.js"
import { Subject, BehaviorSubject, combineLatest, withLatestFrom } from "rxjs"
import { mainPanelSize$ } from "../../../intent/MainPanel"
import { viewportUpdate$ } from "../../../store/Map"
import { AnimationOptions, PlaneVector, ViewportUpdate } from "../../../Type"
import { AnimatedGraphics, TransitionTicker } from "../../../utils/animation"
import { linear, TransitionProcess, vectorTransition } from "../../../utils/transition"
import { Grid, GridLine, GridUpdate } from "./Grid"

interface GridLineOptions extends GridLine {
    width?: number
    color?: number
    label?: string
}
class GridLineGraphics extends AnimatedGraphics<GridLineOptions> {
    private isHorizontal = false
    private position = 0
    private length = 0
    private width = 2
    private color = 0xAAAAAA
    private label?: string
    private labelText?: Text
    private get lineStart(): PlaneVector {
        return this.isHorizontal ? [0, this.position] : [this.position, 0]
    }
    private get lineEnd(): PlaneVector {
        return this.isHorizontal ? [this.length, 0] : [0, this.length]
    }

    protected appearProcess(animation: AnimationOptions): TransitionProcess<number> {
        return {
            duration: animation.duration,
            from: 0,
            to: 0.5,
            fn: linear,
        }
    }
    protected disappearProcess(animation: AnimationOptions): TransitionProcess<number> {
        return {
            duration: animation.duration / 2,
            from: this.graphics.alpha,
            to: 0,
            fn: linear,
        }
    }
    protected move(animation?: AnimationOptions, from?: PlaneVector) {
        if (this.positionTransition) {
            if (animation)
                this.positionTransition.revise({
                    duration: animation.duration / 2,
                    to: this.lineStart,
                })
            else this.positionTransition.revise({
                to: this.lineStart,
            })
        } else if (from && animation) {
            this.positionTransition = new TransitionTicker(Ticker.shared, {
                duration: animation.duration,
                from,
                to: this.lineStart,
                fn: vectorTransition(linear),
                apply: p => { this.graphics.position.set(...p) },
                complete: () => { this.positionTransition = undefined },
            }).start()
        } else {
            this.graphics.position.set(...this.lineStart)
        }
    }
    protected draw() {
        this.graphics
            .clear()
            .lineStyle(this.width, this.color)
            .lineTo(...this.lineEnd)
            .lineStyle(0)
            .beginFill(this.color)
            .endFill()
        if (!this.label || this.label !== this.labelText?.text) {
            this.graphics.removeChildren()
            this.labelText?.destroy()
            this.labelText = undefined
            if (this.label) {
                this.labelText = new Text(this.label, { fontSize: 16 })
                this.labelText.alpha = 0.5
                this.labelText.position.set(...this.isHorizontal ? [8, 4] : [4, 8])
                this.graphics.addChild(this.labelText)
            }
        }
    }

    public constructor(
        container: Container,
        options: GridLineOptions,
    ) {
        super(container)
        Object.assign(this, options)
    }

    public update(
        options: GridLineOptions,
        animation?: AnimationOptions
    ): this {
        const { position, length, width, color, label } = options
        const needDraw = this.label !== label
            || this.length !== length
            || this.color !== color
            || this.width !== width
        const needMove = needDraw || this.position !== position
        const from = this.lineStart
        Object.assign(this, options)
        if (needDraw) this.draw()
        if (needMove) animation ? this.move(animation, from) : this.move()
        return this
    }
}

type GridGraphicsMap = Map<number, GridLineGraphics>
class GridGraphicsGroup {
    private grid: Grid = new Grid()
    private horizLineGraphics: GridGraphicsMap = new Map()
    private vertiLineGraphics: GridGraphicsMap = new Map()

    private updateGraphics(
        graphics: GridGraphicsMap,
        update: GridUpdate,
        animation?: AnimationOptions,
    ): void {
        const { positions, actions: { added, removed, updated } } = update
        const positionsGap = positions.length >= 2 ? positions[1] - positions[0] : 0
        const optionsOf: (line: GridLine) => GridLineOptions = line => {
            const { position, relativePosition } = line
            const isCenterLine = relativePosition === 0
            const isTopLevelLine = relativePosition % this.grid.maxLineGap == 0
            const isMajorLine = positionsGap === 0 || (relativePosition / positionsGap) % 2 === 0
            const canFitLabel = position > 32
            const width = isCenterLine ? 4 : isTopLevelLine ? 3 : isMajorLine ? 2 : 1
            const color = isCenterLine ? 0x888888 : isMajorLine ? 0x999999 : 0xAAAAAA
            const label = isMajorLine && canFitLabel ? `${relativePosition}` : undefined
            return { ...line, width, color, label }
        }
        added.forEach((line, p) =>
            graphics.set(p, new GridLineGraphics(this.container, optionsOf(line)).add(animation)))
        removed.forEach((_, p) => {
            graphics.get(p)?.remove(animation)
            graphics.delete(p)
        })
        updated.forEach((line, p) =>
            graphics.get(p)?.update(optionsOf(line), animation))
    }

    public constructor(
        private container: Container,
    ) { }

    public update(
        size: PlaneVector,
        { viewport, animation }: ViewportUpdate
    ): void {
        const [horizUpdate, vertiUpdate] = this.grid.update(size, viewport)
        this.updateGraphics(this.horizLineGraphics, horizUpdate, animation)
        this.updateGraphics(this.vertiLineGraphics, vertiUpdate, animation)
    }
}

export const gridContainer = new Container()
gridContainer.sortableChildren = true
gridContainer.zIndex = 0

const grids$: Subject<GridGraphicsGroup> = new BehaviorSubject(new GridGraphicsGroup(gridContainer))
const gridUpdate$ = combineLatest([
    mainPanelSize$,
    viewportUpdate$,
])
gridUpdate$
    .pipe(
        withLatestFrom(grids$),
    )
    .subscribe(([[size, viewportUpdate], grid]) => grid.update(size, viewportUpdate))
