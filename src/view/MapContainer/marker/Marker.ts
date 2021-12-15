import { TupleOf } from "../../../type/collection";
import { PlaneEllipse, PlaneLineSegment, PlanePath, PlanePolygon, PlaneRect, PlaneVector } from "../../../type/plane";

export module MarkerPart {
    export enum Type {
        Point = 'Point',
        Line = 'Line',
        Rectangle = 'Rectangle',
        Ellipse = 'Ellipse',
        Polygon = 'Polygon',
    }
    type GeometryData = {
        [Type.Point]: PlaneVector
        [Type.Line]: PlaneLineSegment
        [Type.Rectangle]: PlaneRect
        [Type.Ellipse]: PlaneEllipse
        [Type.Polygon]: PlanePolygon
    }
    export type Data<T extends Type> = {
        data: GeometryData[T]
    }
}

export module Marker {
    import PT = MarkerPart.Type
    import PD = MarkerPart.Data
    export enum Type {
        Point = 'Point',
        Path = 'Path',
        Rectangle = 'Rectangle',
        Ellipse = 'Ellipse',
        Polygon = 'Polygon',
    }
    type GeometryData = {
        [Type.Point]: PlaneVector
        [Type.Path]: PlanePath
        [Type.Rectangle]: PlaneRect
        [Type.Ellipse]: PlaneEllipse
        [Type.Polygon]: PlanePolygon
    }
    type PartData = {
        [Type.Point]: {
            point: PD<PT.Point>
        }
        [Type.Path]: {
            segments: PD<PT.Line>[]
            vertices: PD<PT.Point>[]
        }
        [Type.Rectangle]: {
            rect: PD<PT.Rectangle>
            borders: TupleOf<PD<PT.Line>, 4>
            corners: TupleOf<PD<PT.Point>, 4>
        }
        [Type.Ellipse]: {
            ellipse: PD<PT.Ellipse>
            center: PD<PT.Point>
            axes: PD<PT.Point>
        }
        [Type.Polygon]: {
            polygon: PD<PT.Polygon>
            borders: PD<PT.Line>[]
            vertices: PD<PT.Point>[]
        }
    }
    export type Data<T extends Type> = {
        data: {
            [Type.Point]: PlaneVector
            [Type.Path]: PlanePath
            [Type.Rectangle]: PlaneRect
            [Type.Ellipse]: PlaneEllipse
            [Type.Polygon]: PlanePolygon
        }[T]
    }
}
