import * as PIXI from "pixi.js"
import { WithPrefix } from "../../../type/object";
import { vectorAbs, vectorSubtract } from "../../../utils/math";
import { objectUpdateWithActions } from "../../../utils/object";
import { MarkerPart } from "./Marker";
import PT = MarkerPart.Type

type SharedStyle = {
    zIndex: number
}
type ColorStyle = {
    color: number
    alpha: number
}
type ColorOf<T extends string> = WithPrefix<T, ColorStyle>
type WidthStyle = {
    width: number
}
type WidthOf<T extends string> = WithPrefix<T, WidthStyle>
type SizeStyle = {
    size: number
}
type TextStyle = {
    text: string
}

type PointStyle = (
    SharedStyle &
    ColorOf<'border'> &
    WidthOf<'border'> &
    ColorOf<'fill'> &
    SizeStyle &
    TextStyle
)
type LineStyle = SharedStyle & WidthStyle & ColorStyle
type RectangleStyle = SharedStyle & ColorStyle
type EllipseStyle = SharedStyle & ColorStyle
type PolygonStyle = SharedStyle & ColorStyle

type CommonState = {
    graphics: PIXI.Graphics
}
type TextState = {
    textObject: PIXI.Text
}

type PointState = CommonState & Partial<TextState>
type LineState = CommonState
type RectangleState = CommonState
type EllipseState = CommonState
type PolygonState = CommonState

export module MarkerPartGraphics {
    export interface Action<T extends D, D> {
        init(data: D): T
        update(graphics: T, data: D): void
    }

    export type Style<T extends PT> = {
        [PT.Point]: PointStyle,
        [PT.Line]: LineStyle,
        [PT.Rectangle]: RectangleStyle,
        [PT.Ellipse]: EllipseStyle,
        [PT.Polygon]: PolygonStyle,
    }[T]

    export type State<T extends PT> = {
        [PT.Point]: PointState,
        [PT.Line]: LineState,
        [PT.Rectangle]: RectangleState,
        [PT.Ellipse]: EllipseState,
        [PT.Polygon]: PolygonState,
    }[T]
    export type Props<T extends PT> = MarkerPart.Data<T> & Style<T>
    export type Obj<T extends PT> = Props<T> & State<T>

    type ObjAction<T extends PT> = Readonly<Action<Obj<T>, Props<T>>>
    function init<T extends PT>(data: Props<T>): Obj<T> {
        return { ...data, graphics: new PIXI.Graphics(), }
    }
    function setZIndex(shape: Obj<any>) {
        const { graphics, zIndex } = shape
        graphics.zIndex = zIndex
    }

    export module Point {
        type PartType = PT.Point
        function place(shape: Obj<PartType>) {
            const { graphics, data } = shape
            graphics.position.set(...data)
        }
        function draw(shape: Obj<PartType>) {
            const { graphics, borderWidth, borderColor, borderAlpha, fillColor, fillAlpha, size } = shape
            graphics
                .clear()
                .lineStyle(borderWidth, borderColor, borderAlpha)
                .beginFill(fillColor, fillAlpha)
                .drawCircle(0, 0, size)
                .endFill()
        }
        function write(shape: Obj<PartType>) {
            const { graphics, textObject, text } = shape
            graphics.removeChildren()
            textObject?.destroy()
            shape.textObject = undefined
            if (text) {
                const textObject = new PIXI.Text(text, { fontFamily: 'Arial', fontSize: 16, align: 'center' })
                textObject.anchor.set(0.5, 0.5)
                graphics.addChild(textObject)
            }
        }
        export const Action: ObjAction<PartType> = {
            init,
            update(shape: Obj<PartType>, data: Props<PartType>): void {
                objectUpdateWithActions(shape, data, [
                    [place, 'data'],
                    [draw, 'borderWidth', 'borderColor', 'borderAlpha', 'fillColor', 'fillAlpha', 'size'],
                    [write, 'text'],
                    [setZIndex, 'zIndex'],
                ])
            },
        }
    }
    export module Line {
        type PartType = PT.Line
        function place(shape: Obj<PartType>) {
            const { graphics, data: [start] } = shape
            graphics.position.set(...start)
        }
        function draw(shape: Obj<PartType>) {
            const { graphics, width, color, alpha, data: [start, end] } = shape
            graphics
                .clear()
                .lineStyle(width, color, alpha)
                .lineTo(...vectorSubtract(end, start))
        }
        export const Action: ObjAction<PartType> = {
            init,
            update(shape: Obj<PartType>, data: Props<PartType>): void {
                objectUpdateWithActions(shape, data, [
                    [place, 'data'],
                    [draw, 'width', 'color', 'alpha', 'data'],
                    [setZIndex, 'zIndex'],
                ])
            },
        }
    }
    export module Rectangle {
        type PartType = PT.Rectangle
        function place(shape: Obj<PartType>) {
            const { graphics, data: [position] } = shape
            graphics.position.set(...position)
        }
        function draw(shape: Obj<PartType>) {
            const { graphics, data: [_, size], color, alpha } = shape
            graphics
                .clear()
                .beginFill(color, alpha)
                .drawRect(0, 0, ...size)
                .endFill()
        }
        export const Action: ObjAction<PartType> = {
            init,
            update(shape: Obj<PartType>, data: Props<PartType>): void {
                objectUpdateWithActions(shape, data, [
                    [place, 'data'],
                    [draw, 'data', 'color', 'alpha'],
                    [setZIndex, 'zIndex'],
                ])
            },
        }
    }
    export module Ellipse {
        type PartType = PT.Ellipse
        function place(shape: Obj<PartType>) {
            const { graphics, data: [center] } = shape
            graphics.position.set(...center)
        }
        function draw(shape: Obj<PartType>) {
            const { graphics, data: [center, axes], color, alpha } = shape
            graphics
                .clear()
                .beginFill(color, alpha)
                .drawEllipse(0, 0, ...vectorAbs(vectorSubtract(center, axes)))
                .endFill()
        }
        export const Action: ObjAction<PartType> = {
            init,
            update(shape: Obj<PartType>, data: Props<PartType>): void {
                objectUpdateWithActions(shape, data, [
                    [place, 'data'],
                    [draw, 'data', 'color', 'alpha'],
                    [setZIndex, 'zIndex'],
                ])
            },
        }
    }
    export module Polygon {
        type PartType = PT.Ellipse
        function place(shape: Obj<PartType>) {
            const { graphics, data: [position] } = shape
            graphics.position.set(...position)
        }
        function draw(shape: Obj<PartType>) {
            const { graphics, data, color, alpha } = shape
            graphics
                .clear()
                .beginFill(color, alpha)
                .drawPolygon(new PIXI.Point(), ...data.map(v => vectorSubtract(v, data[0])).map(v => new PIXI.Point(...v)))
                .endFill()
        }
        export const Action: ObjAction<PartType> = {
            init,
            update(shape: Obj<PartType>, data: Props<PartType>): void {
                objectUpdateWithActions(shape, data, [
                    [place, 'data'],
                    [draw, 'data', 'color', 'alpha'],
                    [setZIndex, 'zIndex'],
                ])
            },
        }
    }
}
