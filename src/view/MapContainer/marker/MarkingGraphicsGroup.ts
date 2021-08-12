import { Observable, withLatestFrom, map } from "rxjs"
import { markingMode$ } from "../../../store/MapMarking"
import { PlaneVector, MapMarkingMode } from "../../../Type"
import { segmentIntersectPath } from "../../../utils/geometry"
import { MarkerGraphics } from "./MarkerGraphics"
import {
    MarkingEllipsePlaced,
    MarkingEllipseTemp,
    MarkingPathSegment,
    MarkingPointEnd,
    MarkingPointMiddle,
    MarkingPointStart,
    MarkingPointTemp,
    MarkingPointUnfinished,
    MarkingPolygonBorder,
    MarkingPolygonBorderCrossed,
    MarkingPolygonBorderTemp,
    MarkingPolygonPlaced,
    MarkingPolygonTemp,
    MarkingRectPlaced,
    MarkingRectTemp,
    MarkingTempSegment
} from "./MarkingGraphics"

export abstract class MarkingGraphicsGroup {

    protected abstract get graphics(): MarkerGraphics[]
    private storedGraphics?: MarkerGraphics[]
    private get initedGraphics(): MarkerGraphics[] {
        if (!this.storedGraphics) this.storedGraphics = this.graphics
        return this.storedGraphics
    }

    constructor(
        protected vectors: PlaneVector[],
    ) { }
    display(): void {
        this.initedGraphics.forEach(g => g.add())
    }
    remove(): void {
        this.initedGraphics.forEach(g => g.remove())
    }
}

class TempPointGraphicGroup extends MarkingGraphicsGroup {
    get graphics() {
        return this.vectors.map(v => new MarkingPointTemp(v))
    }
}

class TempPathGraphicGroup extends MarkingGraphicsGroup {
    get graphics() {
        const v = this.vectors
        return v.length === 0 ? [] :
            v.length === 1 ? [new MarkingPointTemp(v[0])] :
                [new MarkingTempSegment(...v.slice(-2) as [PlaneVector, PlaneVector])]
    }
}

class TempRectGraphicGroup extends MarkingGraphicsGroup {
    get graphics() {
        const v = this.vectors
        return v.length <= 1 ? v.map(v => new MarkingPointTemp(v)) : [
            new MarkingPointTemp(v[0]),
            new MarkingPointTemp(v[1]),
            new MarkingRectTemp(v[0], v[1]),
        ]
    }
}

class TempPolygonGraphicGroup extends MarkingGraphicsGroup {
    get graphics() {
        const v = this.vectors
        const closingIntersect = v.length >= 4 && segmentIntersectPath([v[0], v[v.length - 1]], v) !== -1
        const res: MarkerGraphics[] = []
        if (v.length === 1) res.push(new MarkingPointTemp(v[0]))
        else {
            res.push(new MarkingPolygonBorderTemp(v[v.length - 2], v[v.length - 1]))
            res.push(new MarkingPolygonTemp(v))
            if (closingIntersect) res.push(new MarkingPolygonBorderCrossed(v[0], v[v.length - 1]))
        }
        return res
    }
}

class TempEllipseGraphicGroup extends MarkingGraphicsGroup {
    get graphics() {
        const v = this.vectors
        return v.length <= 1 ? v.map(v => new MarkingPointTemp(v)) : [
            new MarkingPointTemp(v[0]),
            new MarkingPointTemp(v[1]),
            new MarkingEllipseTemp(v[0], v[1]),
        ]
    }
}

class PlacedPointGraphicGroup extends MarkingGraphicsGroup {
    get graphics() {
        const v = this.vectors
        return v.map(v => new MarkingPointEnd(v))
    }
}

class PlacedPathGraphicGroup extends MarkingGraphicsGroup {
    get graphics() {
        const res: MarkerGraphics[] = []
        this.vectors.forEach((v, idx, vectors) => {
            if (idx === 0) res.push(new MarkingPointStart(v))
            else {
                res.push(new MarkingPathSegment(v, vectors[idx - 1]))
                res.push(idx === vectors.length - 1 ?
                    new MarkingPointEnd(v) :
                    new MarkingPointMiddle(v, idx))
            }
        })
        return res
    }
}

class PlacedRectGraphicGroup extends MarkingGraphicsGroup {
    get graphics() {
        const v = this.vectors
        switch (v.length) {
            case 1: return [new MarkingPointStart(v[0])]
            case 2: return [
                new MarkingPointStart(v[0]),
                new MarkingRectPlaced(v[0], v[1]),
                new MarkingPointEnd(v[1]),
            ]
            default: return []
        }
    }
}

class PlacedPolygonGraphicGroup extends MarkingGraphicsGroup {
    get graphics() {
        const v = this.vectors
        const closingIntersect = v.length >= 4 && segmentIntersectPath([v[0], v[v.length - 1]], v) !== -1
        const res: MarkerGraphics[] = []
        v.forEach((v, idx, vectors) => {
            if (idx === 0) res.push(new MarkingPointStart(v))
            else {
                res.push(new MarkingPolygonBorder(v, vectors[idx - 1]))
                res.push(idx === vectors.length - 1 ?
                    closingIntersect ?
                        new MarkingPointUnfinished(v) :
                        new MarkingPointEnd(v) :
                    new MarkingPointMiddle(v, idx))
            }
        })
        if (closingIntersect)
            res.push(new MarkingPolygonBorderCrossed(v[0], v[v.length - 1]))
        else if (v.length > 2)
            res.push(new MarkingPolygonPlaced(v))
        return res
    }
}

class PlacedEllipseGraphicGroup extends MarkingGraphicsGroup {
    get graphics() {
        const v = this.vectors
        return v.length <= 1 ? v.map(v => new MarkingPointMiddle(v)) : [
            new MarkingPointMiddle(v[0]),
            new MarkingPointMiddle(v[1]),
            new MarkingEllipsePlaced(v[0], v[1]),
        ]
    }
}

export const mapToMarkingGraphicGroup: (isTemp?: boolean) => (ob: Observable<PlaneVector[]>) => Observable<MarkingGraphicsGroup>
    = isTemp => ob => ob.pipe(
        withLatestFrom(markingMode$.pipe(map(mode => {
            switch (mode) {
                case MapMarkingMode.Path: return isTemp ? TempPathGraphicGroup : PlacedPathGraphicGroup
                case MapMarkingMode.Rect: return isTemp ? TempRectGraphicGroup : PlacedRectGraphicGroup
                case MapMarkingMode.Polygon: return isTemp ? TempPolygonGraphicGroup : PlacedPolygonGraphicGroup
                case MapMarkingMode.Ellipse: return isTemp ? TempEllipseGraphicGroup : PlacedEllipseGraphicGroup
                default: return isTemp ? TempPointGraphicGroup : PlacedPointGraphicGroup
            }
        }))),
        map(([vectors, Group]) => new Group(vectors))
    )


