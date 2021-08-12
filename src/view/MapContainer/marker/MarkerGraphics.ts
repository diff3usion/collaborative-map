import { filters, Graphics, Text, Point } from "pixi.js"
import { Observable, Observer, Subscription, filter } from "rxjs"
import { markingContainer } from "./Marking"
import { PlaneVector, Viewport } from "../../../Type"
import { planeVectorShift, vectorAbsMinus, vectorAdd, vectorFlip, vectorMinus, vectorTimes } from "../../../utils/geometry"
import { scale$, viewportUpdate$ } from "../../../store/Map"
import { linear, Transition, vectorArrayTransition, vectorTransition } from "../../../utils/animation"

const transitionFrames = 12

export interface MarkerOptions {
    zIndex?: number
    size?: number
    lineWidth?: number
    fillColor?: number
    fillAlpha?: number
    lineColor?: number
    lineAlpha?: number
    text?: string
}

export abstract class MarkerGraphics {
    private moveTransition?: Transition<PlaneVector[]>
    private appearTransition?: Transition<number>
    private subscriptions: Subscription[] = []
    private viewport?: Viewport
    private shiftedVectors: PlaneVector[]
    private shift: (vector: PlaneVector) => PlaneVector
        = vector => this.viewport ? planeVectorShift(vector, this.viewport) : vector

    protected abstract position(vectors: PlaneVector[]): PlaneVector
    protected abstract draw(...vectors: PlaneVector[]): void

    protected vectors: PlaneVector[]
    protected g: Graphics = new Graphics()
    protected move(from?: PlaneVector[]) {
        if (from) {
            if (this.moveTransition) {
                this.moveTransition.revise(this.shiftedVectors, 10)
            } else {
                this.moveTransition = new Transition(
                    transitionFrames, from, this.shiftedVectors,
                    p => { 
                        this.g.position.set(...this.position(p))
                        this.draw(...p)
                     },
                    vectorArrayTransition(linear),
                    () => {
                        this.onViewportUpdate(this.shiftedVectors)
                        this.moveTransition = undefined
                    },
                ).start()
            }
        } else {
            this.g.position.set(...this.position(this.shiftedVectors))
            this.onViewportUpdate(this.shiftedVectors)
        }
    }
    protected onViewportUpdate(shiftedVectors: PlaneVector[]) {
        if (this.draw.length) this.draw(...shiftedVectors)
    }
    protected applyOptions(options?: MarkerOptions) {
        if (options) Object.assign(this, options)
        this.draw(...this.shiftedVectors)
    }
    protected collect<T>(eventName: string, observer: Observer<T>) {
        this.g.on(eventName, (e: T) => observer.next(e))
    }
    protected observe<T>(ob: Observable<T>, next: (e: T) => void) {
        this.subscriptions.push(ob.subscribe(next))
    }
    protected constructor(...vectors: PlaneVector[]) {
        this.vectors = vectors
        this.observe(viewportUpdate$, ({ viewport, animated }) => {
            this.viewport = viewport
            const from = animated && this.shiftedVectors ? this.shiftedVectors : undefined
            this.shiftedVectors = vectors.map(v => this.shift(v))
            this.move(from)
        })
        this.shiftedVectors = vectors.map(v => this.shift(v))
    }

    add() {
        markingContainer.addChild(this.g)
    }
    remove() {
        this.subscriptions.forEach(s => s.unsubscribe())
        markingContainer.removeChild(this.g)
        this.g.destroy()
    }
}

export class SinglePointMarker extends MarkerGraphics implements MarkerOptions {
    zIndex = 20
    size = 10
    lineWidth = 2
    fillColor = 0xFFFAFA
    fillAlpha = 1
    borderColor = 0xFCFCFC
    borderAlpha = 1
    text?: string
    protected position(vectors: PlaneVector[]) {
        return vectors[0]
    }
    protected draw() {
        this.g.removeChildren()
        this.g.zIndex = this.zIndex
        this.g
            .clear()
            .lineStyle(this.lineWidth, this.borderColor, this.borderAlpha)
            .beginFill(this.fillColor, this.fillAlpha)
            .drawCircle(0, 0, this.size)
            .endFill()
        if (this.text) {
            const text = new Text(this.text, { fontFamily: 'Arial', fontSize: 16, align: 'center' })
            text.anchor.set(0.5, 0.5)
            this.g.addChild(text)
        }
    }
    protected constructor(v: PlaneVector, init?: MarkerOptions) {
        super(v)
        this.applyOptions(init)
        this.g.interactive = true
    }
}

export class LineMarker extends MarkerGraphics implements MarkerOptions {
    zIndex = 10
    fillColor = 0xFFFFFF
    lineColor = 0xFFFFFF
    size = 10
    lineWidth = 6
    hasEndPoint?: boolean
    protected position(vectors: PlaneVector[]) {
        return vectors[0]
    }
    protected draw(p0: PlaneVector, p1: PlaneVector) {
        this.g.zIndex = this.zIndex
        this.g
            .clear()
            .lineStyle(this.lineWidth, this.lineColor, 1)
            .lineTo(...vectorMinus(p1, p0))
        if (this.hasEndPoint) {
            this.g
                .beginFill(this.fillColor)
                .lineStyle(0)
                .drawCircle(...vectorMinus(p1, p0), this.size)
                .endFill()
        }
    }
    protected constructor(p0: PlaneVector, p1: PlaneVector, init?: MarkerOptions, hasEndPoint?: boolean) {
        super(p0, p1)
        this.hasEndPoint = hasEndPoint
        this.applyOptions(init)
    }
}

export class RectMarker extends MarkerGraphics implements MarkerOptions {
    zIndex = 10
    protected position(vectors: PlaneVector[]) {
        return vectors[0]
    }
    protected draw(p0: PlaneVector, p1: PlaneVector) {
        this.g.zIndex = this.zIndex
        this.g
            .clear()
            .beginFill(0xAAAAAA, 0.5)
            .drawRect(0, 0, ...vectorMinus(p1, p0))
            .endFill()
    }
    protected constructor(p0: PlaneVector, p1: PlaneVector, init?: MarkerOptions) {
        super(p0, p1)
        this.applyOptions(init)
    }
}

export class PolygonMarker extends MarkerGraphics implements MarkerOptions {
    zIndex = 10
    fillAlpha = 0.5
    protected position(vectors: PlaneVector[]) {
        return vectors[0]
    }
    protected draw(startPoint: PlaneVector, ...vectors: PlaneVector[]) {
        this.g.zIndex = this.zIndex
        this.g.alpha = this.fillAlpha
        this.g
            .clear()
            .beginFill(0xAAAAAA)
            .drawPolygon(new Point(), ...vectors.map(v => vectorMinus(v, startPoint)).map(v => new Point(...v)))
            .endFill()
    }
    protected constructor(vectors: PlaneVector[], init?: MarkerOptions) {
        super(...vectors)
        this.applyOptions(init)
    }
}

export class EllipseMarker extends MarkerGraphics implements MarkerOptions {
    zIndex = 10
    fillAlpha = 0.5
    protected position(vectors: PlaneVector[]) {
        return vectors[0]
    }
    protected draw(center: PlaneVector, p: PlaneVector) {
        this.g.zIndex = this.zIndex
        this.g.alpha = this.fillAlpha
        this.g
            .clear()
            .beginFill(0xAAAAAA)
            .drawEllipse(0, 0, ...vectorAbsMinus(center, p))
            .endFill()
    }
    protected constructor(center: PlaneVector, p: PlaneVector, init?: MarkerOptions) {
        super(center, p)
        this.applyOptions(init)
    }
}
