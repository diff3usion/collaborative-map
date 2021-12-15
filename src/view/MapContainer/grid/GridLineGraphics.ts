import * as PIXI from "pixi.js"
import { PlaneVector, PlaneAxis } from "../../../type/plane"
import { PickWithPrefix } from "../../../type/object"
import { axisInverted, planeVectorAligned } from "../../../utils/plane"
import { objectUpdateWithActions } from "../../../utils/object"

import { GridData, GridLineData } from "./GridData"

const labelOffsetX: PlaneVector = [8, 4]
const labelOffsetY: PlaneVector = [4, 8]

export type GridLineGraphics = GridLineGraphics.Obj
export type GridLineStyleProvider = GridLineGraphics.StyleProvider
export module GridLineGraphics {
    export type TransformedData = PickWithPrefix<'transformed', GridData.Line, 'length' | 'position'>
    export type Style = {
        width: number
        color: number
        alpha: number
        label?: string
    }
    export type StyleProvider = (
        line: GridLineData,
        grid: GridData,
        relativeData: GridLineGraphics.TransformedData,
    ) => GridLineGraphics.Style
    export type Props = GridLineData & TransformedData & Style
    export type State = {
        graphics: PIXI.Graphics
        labelText?: PIXI.Text
    }
    export type Obj = Props & State

    function positionPoint(
        { axis, transformedPosition }: Obj
    ): PlaneVector {
        return planeVectorAligned(axisInverted(axis), transformedPosition)
    }
    function lineToEndPoint(
        { axis, transformedLength }: Obj
    ): PlaneVector {
        return planeVectorAligned(axis, transformedLength)
    }
    function labelPositionPoint(
        { axis }: GridLineData
    ): PlaneVector {
        return axis === PlaneAxis.X ? labelOffsetX : labelOffsetY
    }
    function place(
        line: Obj,
    ): void {
        const { graphics } = line
        graphics.position.set(...positionPoint(line))
    }
    function draw(
        line: Obj,
    ): void {
        const { width, color, graphics } = line
        graphics
            .clear()
            .lineStyle(width, color)
            .lineTo(...lineToEndPoint(line))
    }
    function refreshText(
        line: Obj,
    ): void {
        const { graphics, labelText, label } = line
        graphics.removeChildren()
        labelText?.destroy()
        line.labelText = undefined
        if (label) {
            line.labelText = new PIXI.Text(label, { fontSize: 16 })
            line.labelText.position.set(...labelPositionPoint(line))
            graphics.addChild(line.labelText)
        }
    }
    function refreshAlpha(
        line: Obj,
    ): void {
        const { graphics, alpha } = line
        graphics.alpha = alpha
    }

    export function update(
        line: Obj,
        data: Props,
    ): Obj {
        objectUpdateWithActions(line, data, [
            [place, 'transformedPosition'],
            [draw, 'label', 'length', 'color', 'width', 'transformedLength'],
            [refreshText, 'label'],
            [refreshAlpha, 'alpha'],
        ])
        return line
    }
    export function init(
        data: Props,
    ): Obj {
        const res: Obj = { ...data, graphics: new PIXI.Graphics() }
        place(res)
        draw(res)
        refreshText(res)
        refreshAlpha(res)
        return res
    }
}
