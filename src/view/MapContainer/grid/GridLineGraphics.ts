import { Graphics, Text } from "pixi.js"
import { PickWithPrefix, PlaneAxis, PlaneVector } from "../../../Type"
import { someDiffProperties } from "../../../utils/object"
import { GridData } from "./GridData"

export module GridLineGraphics {
    export type RelativeData = PickWithPrefix<'relative', GridData.Line, 'length' | 'position'>
    export type Style = {
        width: number
        color: number
        alpha: number
        label?: string
    }
    export type Data = GridData.Line & RelativeData & Style
    export type State = {
        graphics: Graphics
        labelText?: Text
    }
    export type Obj = Data & State

    function positionPoint(
        { axis, relativePosition }: Obj
    ): PlaneVector {
        return axis === PlaneAxis.X ? [0, relativePosition] : [relativePosition, 0]
    }
    function lineToEndPoint(
        { axis, relativeLength }: Obj
    ): PlaneVector {
        return axis === PlaneAxis.X ? [relativeLength, 0] : [0, relativeLength]
    }
    function labelPositionPoint(
        { axis }: GridData.Line
    ): PlaneVector {
        return axis === PlaneAxis.X ? [8, 4] : [4, 8]
    }
    function move(
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
            line.labelText = new Text(label, { fontSize: 16 })
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
        data: Data,
    ): Obj {
        const needDraw = someDiffProperties(line, data, ['label', 'length', 'color', 'width', 'relativeLength'])
        const needMove = needDraw || someDiffProperties(line, data, ['relativePosition'])
        const needRefreshAlpha = needDraw || someDiffProperties(line, data, ['alpha'])
        const needRefreshText = someDiffProperties(line, data, ['label'])
        Object.assign(line, data)
        if (needMove) move(line)
        if (needDraw) draw(line)
        if (needRefreshText) refreshText(line)
        if (needRefreshAlpha) refreshAlpha(line)
        return line
    }
    export function init(
        data: Data,
    ): Obj {
        const res: Obj = { ...data, graphics: new Graphics() }
        move(res)
        draw(res)
        refreshText(res)
        refreshAlpha(res)
        return res
    }
}
