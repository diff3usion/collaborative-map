import { Observable, withLatestFrom, map } from "rxjs"
import { markingMode$ } from "../../../store/MapMarking"
import { PlaneVector, MapMarkingMode } from "../../../Type"
import { segmentIntersectPath } from "../../../utils/geometry"
import { MarkerGraphics } from "./MarkerGraphics"
import {
    PlacedEllipse,
    PlacedPathSegment,
    PlacedPointEnd, PlacedPointMiddle, PlacedPointStart, PlacedPointUnfinished,
    PlacedPolygon, PlacedPolygonBorder, PlacedPolygonBorderCrossed,
    PlacedRect,
    TempEllipse,
    TempPathSegment,
    TempPoint,
    TempPolygon, TempPolygonBorder,
    TempRect
} from "./MarkingGraphics"

export enum MarkingGraphicsType {
    Temp,
    Placed,
    Confirmed,
}

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
        return this.vectors.map(v => new TempPoint(v))
    }
}

class TempPathGraphicGroup extends MarkingGraphicsGroup {
    get graphics() {
        const v = this.vectors
        const res = []
        if (this.vectors.length > 0) {
            if (this.vectors.length > 1)
                res.push(new TempPathSegment(...v.slice(-2) as [PlaneVector, PlaneVector]))
            res.push(new TempPoint(v[v.length - 1]))
        }
        return res
    }
}

class TempRectGraphicGroup extends MarkingGraphicsGroup {
    get graphics() {
        const v = this.vectors
        return v.length <= 1 ? v.map(v => new TempPoint(v)) : [
            new TempPoint(v[0]),
            new TempPoint(v[1]),
            new TempRect(v[0], v[1]),
        ]
    }
}

class TempPolygonGraphicGroup extends MarkingGraphicsGroup {
    get graphics() {
        const v = this.vectors
        const closingIntersect = v.length >= 4 && segmentIntersectPath([v[0], v[v.length - 1]], v) == -1
        const res: MarkerGraphics[] = []
        if (v.length > 1) {
            res.push(new TempPolygonBorder(v[v.length - 2], v[v.length - 1]))
            res.push(new TempPolygon(v))
            if (closingIntersect) res.push(new PlacedPolygonBorderCrossed(v[0], v[v.length - 1]))
        }
        res.push(new TempPoint(v[v.length - 1]))
        return res
    }
}

class TempEllipseGraphicGroup extends MarkingGraphicsGroup {
    get graphics() {
        const v = this.vectors
        return v.length <= 1 ? v.map(v => new TempPoint(v)) : [
            new TempPoint(v[0]),
            new TempPoint(v[1]),
            new TempEllipse(v[0], v[1]),
        ]
    }
}

class PlacedPointGraphicGroup extends MarkingGraphicsGroup {
    get graphics() {
        const v = this.vectors
        return v.map(v => new PlacedPointEnd(v))
    }
}

class PlacedPathGraphicGroup extends MarkingGraphicsGroup {
    get graphics() {
        const res: MarkerGraphics[] = []
        this.vectors.forEach((v, idx, vectors) => {
            if (idx === 0) res.push(new PlacedPointStart(v))
            else {
                res.push(new PlacedPathSegment(v, vectors[idx - 1]))
                res.push(idx === vectors.length - 1 ?
                    new PlacedPointEnd(v) :
                    new PlacedPointMiddle(v, idx))
            }
        })
        return res
    }
}

class PlacedRectGraphicGroup extends MarkingGraphicsGroup {
    get graphics() {
        const v = this.vectors
        switch (v.length) {
            case 1: return [new PlacedPointStart(v[0])]
            case 2: return [
                new PlacedPointStart(v[0]),
                new PlacedRect(v[0], v[1]),
                new PlacedPointEnd(v[1]),
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
            if (idx === 0) res.push(new PlacedPointStart(v))
            else {
                res.push(new PlacedPolygonBorder(v, vectors[idx - 1]))
                res.push(idx === vectors.length - 1 ?
                    closingIntersect ?
                        new PlacedPointUnfinished(v) :
                        new PlacedPointEnd(v) :
                    new PlacedPointMiddle(v, idx))
            }
        })
        if (closingIntersect)
            res.push(new PlacedPolygonBorderCrossed(v[0], v[v.length - 1]))
        else if (v.length > 2)
            res.push(new PlacedPolygon(v))
        return res
    }
}

class PlacedEllipseGraphicGroup extends MarkingGraphicsGroup {
    get graphics() {
        const v = this.vectors
        return v.length <= 1 ? v.map(v => new PlacedPointStart(v)) : [
            new PlacedPointStart(v[0]),
            new PlacedPointEnd(v[1]),
            new PlacedEllipse(v[0], v[1]),
        ]
    }
}

class ConfirmedPointGraphicGroup extends MarkingGraphicsGroup {
    get graphics() {
        const v = this.vectors
        return v.map(v => new PlacedPointEnd(v))
    }
}

class ConfirmedPathGraphicGroup extends MarkingGraphicsGroup {
    get graphics() {
        const res: MarkerGraphics[] = []
        this.vectors.forEach((v, idx, vectors) => {
            if (idx === 0) res.push(new PlacedPointStart(v))
            else {
                res.push(new PlacedPathSegment(v, vectors[idx - 1]))
                res.push(idx === vectors.length - 1 ?
                    new PlacedPointEnd(v) :
                    new PlacedPointMiddle(v, idx))
            }
        })
        return res
    }
}

class ConfirmedRectGraphicGroup extends MarkingGraphicsGroup {
    get graphics() {
        const v = this.vectors
        switch (v.length) {
            case 1: return [new PlacedPointStart(v[0])]
            case 2: return [
                new PlacedPointStart(v[0]),
                new PlacedRect(v[0], v[1]),
                new PlacedPointEnd(v[1]),
            ]
            default: return []
        }
    }
}

class ConfirmedPolygonGraphicGroup extends MarkingGraphicsGroup {
    get graphics() {
        const v = this.vectors
        const closingIntersect = v.length >= 4 && segmentIntersectPath([v[0], v[v.length - 1]], v) !== -1
        const res: MarkerGraphics[] = []
        v.forEach((v, idx, vectors) => {
            if (idx === 0) res.push(new PlacedPointStart(v))
            else {
                res.push(new PlacedPolygonBorder(v, vectors[idx - 1]))
                res.push(idx === vectors.length - 1 ?
                    closingIntersect ?
                        new PlacedPointUnfinished(v) :
                        new PlacedPointEnd(v) :
                    new PlacedPointMiddle(v, idx))
            }
        })
        if (closingIntersect)
            res.push(new PlacedPolygonBorderCrossed(v[0], v[v.length - 1]))
        else if (v.length > 2)
            res.push(new PlacedPolygon(v))
        return res
    }
}

class ConfirmedEllipseGraphicGroup extends MarkingGraphicsGroup {
    get graphics() {
        const v = this.vectors
        return v.length <= 1 ? v.map(v => new PlacedPointStart(v)) : [
            new PlacedPointStart(v[0]),
            new PlacedPointEnd(v[1]),
            new PlacedEllipse(v[0], v[1]),
        ]
    }
}

export const mapToMarkingGraphicGroup: (type: MarkingGraphicsType) => (ob: Observable<PlaneVector[]>) => Observable<MarkingGraphicsGroup>
    = type => ob => ob.pipe(
        withLatestFrom(markingMode$.pipe(map(mode => {
            switch (type) {
                case MarkingGraphicsType.Temp: switch (mode) {
                    case MapMarkingMode.Path: return TempPathGraphicGroup
                    case MapMarkingMode.Rect: return TempRectGraphicGroup
                    case MapMarkingMode.Polygon: return TempPolygonGraphicGroup
                    case MapMarkingMode.Ellipse: return TempEllipseGraphicGroup
                    default: return TempPointGraphicGroup
                }
                case MarkingGraphicsType.Placed: switch (mode) {
                    case MapMarkingMode.Path: return PlacedPathGraphicGroup
                    case MapMarkingMode.Rect: return PlacedRectGraphicGroup
                    case MapMarkingMode.Polygon: return PlacedPolygonGraphicGroup
                    case MapMarkingMode.Ellipse: return PlacedEllipseGraphicGroup
                    default: return PlacedPointGraphicGroup
                }
                default: switch (mode) {
                    case MapMarkingMode.Path: return ConfirmedPathGraphicGroup
                    case MapMarkingMode.Rect: return ConfirmedRectGraphicGroup
                    case MapMarkingMode.Polygon: return ConfirmedPolygonGraphicGroup
                    case MapMarkingMode.Ellipse: return ConfirmedEllipseGraphicGroup
                    default: return ConfirmedPointGraphicGroup
                }
            }
        }))),
        map(([vectors, Group]) => new Group(vectors))
    )

