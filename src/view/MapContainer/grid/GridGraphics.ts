import { Graphics, Text, Ticker, Container } from "pixi.js"
import { Subject, BehaviorSubject, combineLatest, withLatestFrom } from "rxjs"
import { mainPanelSize$ } from "../../../intent/MainPanel"
import { viewportUpdate$ } from "../../../store/Map"
import { PlaneVector, ViewportUpdate } from "../../../Type"
import { TransitionTicker } from "../../../utils/animation"
import { initMap } from "../../../utils/collection"
import { linear, vectorTransition } from "../../../utils/transition"
import { Grid, GridUpdate } from "./Grid"

const transitionFrames = 120

type GridLineStyle = {
    width?: number
    color?: number
    label?: string
}
class GridLineGraphics {
    private width = 2
    private color = 0xAAAAAA
    private label?: string
    private labelText?: Text
    private positionTransition?: TransitionTicker<PlaneVector>
    private visibilityTransition?: TransitionTicker<number>
    private g: Graphics = new Graphics()
    private get start(): PlaneVector {
        return this.isHorizontal ? [0, this.position] : [this.position, 0]
    }
    private get end(): PlaneVector {
        return this.isHorizontal ? [this.length, 0] : [0, this.length]
    }
    private appear() {
        this.g.alpha = 0
        this.container.addChild(this.g)
        this.visibilityTransition = new TransitionTicker(Ticker.shared, {
            duration: transitionFrames,
            from: 0,
            to: 0.5,
            fn: linear,
            apply: a => { this.g.alpha = a },
            complete: () => { this.visibilityTransition = undefined },
        }).start()
    }
    private disappear() {
        const destroy = () => {
            this.container.removeChild(this.g)
            this.g.destroy()
        }
        if (this.visibilityTransition) {
            this.visibilityTransition.revise({
                to: 0,
                duration: transitionFrames / 2,
                complete: destroy,
            })
        } else {
            this.visibilityTransition = new TransitionTicker(Ticker.shared, {
                duration: transitionFrames / 2,
                from: this.g.alpha,
                to: 0,
                fn: linear,
                apply: a => { this.g.alpha = a },
                complete: destroy,
            }).start()
        }
    }
    private move(from?: PlaneVector) {
        if (this.positionTransition) {
            this.positionTransition.revise({
                duration: transitionFrames / 2,
                to: this.start,
            })
        } else {
            if (from) {
                this.positionTransition = new TransitionTicker(Ticker.shared, {
                    duration: transitionFrames,
                    from,
                    to: this.start,
                    fn: vectorTransition(linear),
                    apply: p => { this.g.position.set(...p) },
                    complete: () => { this.positionTransition = undefined },
                }).start()
            } else {
                this.g.position.set(...this.start)
            }
        }
    }
    private draw() {
        const nodeSize = this.width + 1
        this.g
            .clear()
            .lineStyle(this.width, this.color)
            .lineTo(...this.end)
            .lineStyle(0)
            .beginFill(this.color)
            .endFill()
    }
    private write() {
        this.g.removeChildren()
        if (this.label) {
            this.labelText = new Text(this.label, { fontSize: 16 })
            this.labelText.alpha = 0.5
            this.labelText.position.set(...this.isHorizontal ? [8, 4] : [4, 8])
            this.g.addChild(this.labelText)
        }
    }

    public constructor(
        private container: Container,
        private isHorizontal: boolean,
        private position: number,
        private length: number,
        style?: GridLineStyle,
    ) {
        Object.assign(this, style)
        this.move()
        this.draw()
        this.write()
        this.appear()
    }

    public update(
        position: number,
        length: number,
        style: GridLineStyle,
        animated: boolean
    ) {
        const needWrite = this.label !== style.label
        const needDraw = needWrite || this.length !== length || this.color !== style.color || this.width !== style.width
        const needMove = needDraw || this.position !== position
        const from = this.start
        this.position = position
        this.length = length
        Object.assign(this, style)
        if (needMove) animated ? this.move(from) : this.move()
        if (needDraw) this.draw()
        if (needWrite) this.write()
    }
    public remove() {
        if (this.positionTransition) {
            this.positionTransition.revise({
                complete: () => this.disappear()
            })
        } else {
            this.disappear()
        }
    }
}

type GridGraphicsMap = Map<number, GridLineGraphics>
class GridGraphicsGroup {
    private grid: Grid = new Grid()
    private horizLineGraphics: GridGraphicsMap = new Map()
    private vertiLineGraphics: GridGraphicsMap = new Map()

    private buildStyle(
        positions: number[]
    ): Map<number, GridLineStyle> {
        const positionsGap = positions.length >= 2 ? positions[1] - positions[0] : 0
        const styleOf: (position: number) => GridLineStyle = position => {
            const isCenterLine = position === 0
            const isTopLevelLine = position % this.grid.maxLineGap == 0
            const isMajorLine = positionsGap === 0 || (position / positionsGap) % 2 === 0
            const width = isCenterLine ? 4 : isTopLevelLine ? 3 : isMajorLine ? 2 : 1
            const color = isCenterLine ? 0x888888 : isMajorLine ? 0x999999 : 0xAAAAAA
            const label = isMajorLine ? `${position}` : undefined
            return { width, color, label }
        }
        return initMap(positions, styleOf)
    }

    private updateGraphics(
        graphics: GridGraphicsMap,
        update: GridUpdate,
        animated: boolean,
    ): void {
        const { positions, actions: { added, removed, updated } } = update
        const styles = this.buildStyle(positions)
        added.forEach((line, p) =>
            graphics.set(p, new GridLineGraphics(this.container, line.isHorizontal, line.position, line.length, styles.get(p)!)))
        removed.forEach((_, p) => {
            graphics.get(p)?.remove()
            graphics.delete(p)
        })
        updated.forEach(({ position, length }, p) =>
            graphics.get(p)?.update(position, length, styles.get(p)!, animated))
    }

    public constructor(
        private container: Container,
    ) { }

    public update(
        size: PlaneVector,
        { viewport, animated }: ViewportUpdate
    ): void {
        const [horizUpdate, vertiUpdate] = this.grid.update(size, viewport)
        this.updateGraphics(this.horizLineGraphics, horizUpdate, animated)
        this.updateGraphics(this.vertiLineGraphics, vertiUpdate, animated)
    }
}

export const gridContainer = new Container()
gridContainer.sortableChildren = true
gridContainer.zIndex = 0

const grids$: Subject<GridGraphicsGroup> = new BehaviorSubject(new GridGraphicsGroup(gridContainer))
combineLatest([
    mainPanelSize$,
    viewportUpdate$,
]).pipe(
    withLatestFrom(grids$),
).subscribe(([[size, viewportUpdate], grid]) => grid.update(size, viewportUpdate))


