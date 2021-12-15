import * as PIXI from "pixi.js"
import { WithPrefix } from "../../../type/object";
import { Marker, MarkerPart } from "./Marker";
import { MarkerPartGraphics } from "./MarkerPartGraphics";
import PT = MarkerPart.Type
import MT = Marker.Type

type PartStyle<T extends PT> = {
    style: MarkerPartGraphics.Style<T>
}
type PartStyleOf<P extends string, T extends PT> = WithPrefix<P, PartStyle<T>>
type TerminalStyle = (
    PartStyleOf<'startPoint', PT.Point> &
    PartStyleOf<'endPoint', PT.Point>
)
type OptionalTerminalStyle = Partial<TerminalStyle>

type PartGraphics<T extends PT> = {
    graphics: MarkerPartGraphics.Obj<T>
}
type PartGraphicsOf<P extends string, T extends PT> = WithPrefix<P, PartGraphics<T>>
type PartGraphicsList<T extends PT> = {
    graphics: MarkerPartGraphics.Obj<T>[]
}
type PartGraphicsListOf<P extends string, T extends PT> = WithPrefix<P, PartGraphicsList<T>>

type PointStyle = PartStyle<PT.Point>
type PathSytle = (
    PartStyleOf<'line', PT.Line> &
    PartStyleOf<'vertex', PT.Point> &
    OptionalTerminalStyle
)
type RectangleStyle = (
    PartStyleOf<'rect', PT.Rectangle> &
    PartStyleOf<'border', PT.Line> &
    PartStyleOf<'corner', PT.Point> &
    OptionalTerminalStyle
)
type EllipseStyle = (
    PartStyleOf<'ellipse', PT.Ellipse> &
    PartStyleOf<'center', PT.Point> &
    PartStyleOf<'axes', PT.Point>
)
type PolygonStyle = (
    PartStyleOf<'polygon', PT.Polygon> &
    PartStyleOf<'line', PT.Line> &
    PartStyleOf<'vertex', PT.Point> &
    OptionalTerminalStyle
)

export module MarkerGraphicsGroup {
    export type Style<T extends MT> = {
        [MT.Point]: PointStyle,
        [MT.Path]: PathSytle,
        [MT.Rectangle]: RectangleStyle,
        [MT.Ellipse]: EllipseStyle,
        [MT.Polygon]: PolygonStyle,
    }[T]

    export type Props<T extends MT> = Marker.Data<T> & Style<T>
    export type State<T extends MT> = {
        [MT.Point]: PartGraphics<PT.Point>,
        [MT.Path]: (
            PartGraphicsListOf<'line', PT.Line> &
            PartGraphicsListOf<'vertex', PT.Point>
        ),
        [MT.Rectangle]: (
            PartGraphicsOf<'rect', PT.Rectangle> &
            PartGraphicsListOf<'border', PT.Line> &
            PartGraphicsListOf<'corner', PT.Point>
        ),
        [MT.Ellipse]: (
            PartGraphicsOf<'ellipse', PT.Ellipse> &
            PartGraphicsOf<'center', PT.Point> &
            PartGraphicsOf<'axes', PT.Point>
        ),
        [MT.Polygon]: (
            PartGraphicsOf<'polygon', PT.Polygon> &
            PartGraphicsListOf<'line', PT.Line> &
            PartGraphicsListOf<'vertex', PT.Point>
        ),
    }[T]
    export type Obj<T extends MT> = Props<T> & State<T>

    export type Point = Obj<MT.Point>
    export type Path = Obj<MT.Path>
    export type Rectangle = Obj<MT.Rectangle>
    export type Ellipse = Obj<MT.Ellipse>
    export type Polygon = Obj<MT.Polygon>


}
