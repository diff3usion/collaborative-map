import { Container, Graphics, Text } from "pixi.js"
import { BehaviorSubject, combineLatest, map, pairwise, Subject, tap, withLatestFrom } from "rxjs"
import { mainPanelSize$ } from "../../intent/MainPanel"
import { viewport$, viewportUpdate$ } from "../../store/Map"
import { PlaneVector, Viewport, ViewportUpdate } from "../../Type"
import { boundedNumber, initArray, mapPartition, nearestSmallerPowerOf2 } from "../../utils"
import { Transition, linear, vectorTransition } from "../../utils/animation"
import { numberShift } from "../../utils/geometry"

export const gridContainer = new Container()
gridContainer.sortableChildren = true
gridContainer.zIndex = 0

const transitionFrames = 12
const desiredLineCount = 16
const minLineGap = 4
const maxLineGap = 1024

class GridLine {
    private labelText?: Text
    private moveTransition?: Transition<PlaneVector>
    private appearTransition?: Transition<number>
    public constructor(
        private container: Container,
        private isHorizontal: boolean,
        private position: number,
        private length: number,
        private relativePosition: number,
        private isMajorLine: boolean,
    ) {
        this.move()
        this.draw()
        this.write()
        this.appear()
    }
    public update(position: number, length: number, isMajorLine: boolean, animated: boolean) {
        const needWrite = this.isMajorLine !== isMajorLine
        const needDraw = this.length !== length || needWrite
        const needMove = this.position !== position || needDraw
        const from = this.start
        this.isMajorLine = isMajorLine
        this.position = position
        this.length = length
        if (needMove) animated ? this.move(from) : this.move()
        if (needDraw) this.draw()
        if (needWrite) this.write()
    }
    public remove() {
        this.appearTransition?.stop()
        this.moveTransition?.stop()
        this.disappear()
    }

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
        this.appearTransition = new Transition(
            transitionFrames, 0, 0.5,
            a => { this.g.alpha = a },
            linear,
            () => { this.appearTransition = undefined },
        ).start()
    }
    private disappear() {
        new Transition(
            transitionFrames, this.g.alpha, 0,
            a => { this.g.alpha = a },
            linear,
            () => {
                this.container.removeChild(this.g)
                this.g.destroy()
            }
        ).start()
    }
    private move(from?: PlaneVector) {
        if (from) {
            if (this.moveTransition) {
                this.moveTransition.revise(this.start, transitionFrames)
            } else {
                this.moveTransition = new Transition(
                    transitionFrames, from, this.start,
                    p => { this.g.position.set(...p) },
                    vectorTransition(linear),
                    () => { this.moveTransition = undefined },
                ).start()
            }
        } else {
            this.g.position.set(...this.start)
        }
    }
    private draw() {
        const isCenterLine = this.relativePosition === 0
        const isTopLevelLine = this.relativePosition % maxLineGap == 0
        const width = isCenterLine ? 4 : isTopLevelLine ? 3 : this.isMajorLine ? 2 : 1
        const color = isCenterLine ? 0x888888 : this.isMajorLine ? 0x999999 : 0xAAAAAA
        const nodeSize = isCenterLine ? 5 : this.isMajorLine ? 4 : 3
        this.g
            .clear()
            .lineStyle(width, color)
            .lineTo(...this.end)
            .lineStyle(0)
            .beginFill(color)
            .drawCircle(0, 0, nodeSize)
            .drawCircle(...this.end, nodeSize)
            .endFill()
    }
    private write() {
        this.g.removeChildren()
        if (this.isMajorLine) {
            this.labelText = new Text(`${this.relativePosition}`, { fontSize: 16 })
            this.labelText.alpha = 0.5
            this.labelText.position.set(...this.isHorizontal ? [16, 0] : [0, 16])
            this.g.addChild(this.labelText)
        }
    }
}

const sizeToGridLineGap: (size: PlaneVector, scale: number) => number
    = (size, scale) => boundedNumber(minLineGap, maxLineGap, Math.min(...size.map(s => nearestSmallerPowerOf2(s / scale / desiredLineCount))))

const gridPositions: (delta: number, length: number, gap: number, scale: number) => number[]
    = (delta, length, gap, scale) => {
        const start = Math.ceil(delta / scale / gap) * gap
        const count = Math.ceil(Math.floor(length / scale - (start - delta / scale)) / gap)
        return initArray(count, idx => start + idx * gap)
    }

type GridLineMap = Map<number, GridLine>
type Grid = [GridLineMap, GridLineMap]

const updateGridLines: (
    isHorizontal: boolean,
    lines: GridLineMap,
    viewport: Viewport,
    positions: number[],
    length: number,
    scale: number,
    animated: boolean) => GridLineMap
    = (isHorizontal, lines, viewport, positions, length, scale, animated) => {
        const positionsGap = positions.length >= 2 ? positions[1] - positions[0] : 0
        const isMajorLine = (position: number) => positionsGap === 0 || (position / positionsGap) % 2 === 0
        const newPositions = new Set(positions)
        const [res, outdated] = mapPartition(lines, p => newPositions.has(p))
        res.forEach((l, p) => l.update(numberShift(p, isHorizontal, viewport), length, isMajorLine(p), animated))
        outdated.forEach(l => l.remove())
        positions
            .filter(p => !res.has(p))
            .map(p => <const>[p, new GridLine(gridContainer, isHorizontal, numberShift(p, isHorizontal, viewport), length, p, isMajorLine(p))])
            .forEach(([p, l]) => res.set(p, l))
        return res
    }

const updateGrid: (grid: Grid, size: PlaneVector, viewportUpdate: ViewportUpdate) => Grid
    = ([horizLines, vertiLines], [width, height], { viewport: { position: [x, y], scale }, animated }) => {
        const gap = sizeToGridLineGap([width, height], scale)
        const horizPositions = gridPositions(-y, height, gap, scale)
        const vertiPositions = gridPositions(-x, width, gap, scale)
        const resHorizLines = updateGridLines(true, horizLines, { position: [x, y], scale }, horizPositions, width, scale, animated)
        const resVertiLines = updateGridLines(false, vertiLines, { position: [x, y], scale }, vertiPositions, height, scale, animated)
        return [resHorizLines, resVertiLines]
    }

const gridLines$: Subject<Grid> = new BehaviorSubject<Grid>([new Map(), new Map()])
combineLatest([
    mainPanelSize$,
    viewportUpdate$,
]).pipe(
    withLatestFrom(gridLines$),
    map(([[size, viewportUpdate], lines]) => updateGrid(lines, size, viewportUpdate)),
).subscribe(gridLines$)

