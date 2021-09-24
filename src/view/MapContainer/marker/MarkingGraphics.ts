import { filters } from "pixi.js"
import { filter, Observable, Observer } from "rxjs"
import {
    tempPointPointerUp$, tempPointPointerMove$, tempPointPointerOver$, tempPointPointerOut$,
    placedPointPointerDown$, placedPointPointerUp$, placedPointPointerMove$, placedPointPointerOver$, placedPointPointerOut$,
    endPointPointerDown$, endPointPointerUp$,
    startPointPointerDown$, startPointPointerUp$
} from "../../../intent/MapMarking"
import { PlaneVector } from "../../../Type"
import { EllipseMarker, LineMarker, MarkerGraphics, MarkerOptions, PolygonMarker, RectMarker, SinglePointMarker } from "./MarkerGraphics"


interface WithCollect {
    collect<T>(eventName: string, observer: Observer<T>): void
}

interface WithObserve {
    observe<T>(ob: Observable<T>, next: (e: T) => void): void
}

const collectTempPointEvents = (mg: MarkerGraphics) => {
    const e = <WithCollect><any>mg
    e.collect('pointerup', tempPointPointerUp$)
    e.collect('pointermove', tempPointPointerMove$)
    e.collect('pointerover', tempPointPointerOver$)
    e.collect('pointerout', tempPointPointerOut$)
}

const collectPlacedPointEvents = (mg: MarkerGraphics) => {
    const e = <WithCollect><any>mg
    e.collect('pointerdown', placedPointPointerDown$)
    e.collect('pointerup', placedPointPointerUp$)
    e.collect('pointermove', placedPointPointerMove$)
    e.collect('pointerover', placedPointPointerOver$)
    e.collect('pointerout', placedPointPointerOut$)
}

export class PlacedPointStart extends SinglePointMarker {
    constructor(v: PlaneVector) {
        const normalOptions = { fillColor: 0xCCFFCC }
        const hoverOptions = { fillColor: 0xAAFFAA }
        super(v, normalOptions)
        collectPlacedPointEvents(this)
        this.collect('pointerdown', startPointPointerDown$)
        this.collect('pointerup', startPointPointerUp$)
        this.observe(placedPointPointerOver$.pipe(filter(e => e.currentTarget === this.g)), () => {
            this.applyOptions(hoverOptions)
        })
        this.observe(placedPointPointerOut$.pipe(filter(e => e.currentTarget === this.g)), () => {
            this.applyOptions(normalOptions)
        })
    }
}

export class PlacedPointMiddle extends SinglePointMarker {
    constructor(v: PlaneVector, idx?: number) {
        const normalOptions: MarkerOptions = { fillColor: 0xFFFAFA }
        const hoverOptions: MarkerOptions = { fillColor: 0xFFCCCC }
        if (idx) {
            normalOptions.text = `${idx}`
            hoverOptions.text = `${idx}`
        }
        super(v, normalOptions)
        collectPlacedPointEvents(this)
        this.observe(placedPointPointerOver$.pipe(filter(e => e.currentTarget === this.g)), () => {
            this.applyOptions(hoverOptions)
        })
        this.observe(placedPointPointerOut$.pipe(filter(e => e.currentTarget === this.g)), () => {
            this.applyOptions(normalOptions)
        })
    }
}

export class PlacedPointEnd extends SinglePointMarker {
    constructor(v: PlaneVector) {
        const normalOptions: MarkerOptions = { fillColor: 0xCCCCFF }
        const hoverOptions: MarkerOptions = { fillColor: 0xAAAAFF }
        super(v, normalOptions)
        collectPlacedPointEvents(this)
        this.collect('pointerdown', endPointPointerDown$)
        this.collect('pointerup', endPointPointerUp$)
        this.observe(placedPointPointerOver$.pipe(filter(e => e.currentTarget === this.g)), () => {
            this.applyOptions(hoverOptions)
        })
        this.observe(placedPointPointerOut$.pipe(filter(e => e.currentTarget === this.g)), () => {
            this.applyOptions(normalOptions)
        })
    }
}

export class PlacedPointUnfinished extends SinglePointMarker {
    constructor(v: PlaneVector) {
        const normalOptions = { fillColor: 0xFFCCCC }
        const hoverOptions = { fillColor: 0xFFCCCC }
        super(v, normalOptions)
        collectPlacedPointEvents(this)
        this.observe(placedPointPointerOver$.pipe(filter(e => e.currentTarget === this.g)), () => {
            this.applyOptions(hoverOptions)
        })
        this.observe(placedPointPointerOut$.pipe(filter(e => e.currentTarget === this.g)), () => {
            this.applyOptions(normalOptions)
        })
        return this
    }
}

export class TempPoint extends SinglePointMarker {
    constructor(v: PlaneVector) {
        const options: MarkerOptions = { fillAlpha: 0.5 }
        super(v, options)
        collectTempPointEvents(this)
    }
}

export class ConfirmedPoint extends SinglePointMarker {
    constructor(v: PlaneVector, idx?: number) {
        const normalOptions: MarkerOptions = { fillColor: 0xFFFAFA }
        const hoverOptions: MarkerOptions = { fillColor: 0xFFCCCC }
        if (idx) {
            normalOptions.text = `${idx}`
            hoverOptions.text = `${idx}`
        }
        super(v, normalOptions)
        collectPlacedPointEvents(this)
        this.observe(placedPointPointerOver$.pipe(filter(e => e.currentTarget === this.g)), () => {
            this.applyOptions(hoverOptions)
        })
        this.observe(placedPointPointerOut$.pipe(filter(e => e.currentTarget === this.g)), () => {
            this.applyOptions(normalOptions)
        })
    }
}

export class PlacedPathSegment extends LineMarker {
    constructor(p0: PlaneVector, p1: PlaneVector) {
        super(p0, p1)
    }
}

export class TempPathSegment extends LineMarker {
    constructor(p0: PlaneVector, p1: PlaneVector) {
        super(p0, p1, undefined)
        const colorMatrix = new filters.AlphaFilter();
        colorMatrix.alpha = 0.5;
        this.g.filters = [colorMatrix];
    }
}

export class ConfirmedPathSegment extends LineMarker {
    constructor(p0: PlaneVector, p1: PlaneVector) {
        super(p0, p1)
    }
}

export class PlacedPolygonBorder extends LineMarker {
    constructor(p0: PlaneVector, p1: PlaneVector) {
        const normalOptions: MarkerOptions = { lineColor: 0xAAAAAA, lineWidth: 4 }
        super(p0, p1, normalOptions)
    }
}

export class PlacedPolygonBorderCrossed extends LineMarker {
    constructor(p0: PlaneVector, p1: PlaneVector) {
        super(p0, p1, { lineWidth: 4, lineColor: 0xFFCCCC })
    }
}

export class TempPolygonBorder extends LineMarker {
    constructor(p0: PlaneVector, p1: PlaneVector) {
        super(p0, p1, { lineColor: 0xAAAAAA, lineWidth: 4 })
        const colorMatrix = new filters.AlphaFilter();
        colorMatrix.alpha = 0.5;
        this.g.filters = [colorMatrix];
    }
}

export class PlacedRect extends RectMarker {
    constructor(p0: PlaneVector, p1: PlaneVector) {
        super(p0, p1)
    }
}

export class TempRect extends RectMarker {
    constructor(p0: PlaneVector, p1: PlaneVector) {
        super(p0, p1)
    }
}

export class PlacedPolygon extends PolygonMarker {
    constructor(vectors: PlaneVector[]) {
        super(vectors)
    }
}

export class TempPolygon extends PolygonMarker {
    constructor(vectors: PlaneVector[]) {
        super([vectors[0], ...vectors.slice(-2)])
    }
}

export class PlacedEllipse extends EllipseMarker {
    constructor(center: PlaneVector, p: PlaneVector) {
        super(center, p)
    }
}

export class TempEllipse extends EllipseMarker {
    constructor(center: PlaneVector, p: PlaneVector) {
        super(center, p)
    }
}
