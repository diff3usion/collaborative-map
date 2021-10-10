import { Graphics, Text } from "pixi.js"
import { PlaneAxis, PlaneVector } from "../../../Type"
import { someDiffProperties } from "../../../utils/object"
import { GridLineData } from "./GridData"

export type GridLineGraphicsStyle = {
    width: number
    color: number
    alpha: number
    label?: string
}
export type GridLineGraphicsData = GridLineData & GridLineGraphicsStyle
export type GridLineGraphicsState = {
    graphics: Graphics
    labelText?: Text
}
export type GridLineGraphics = GridLineGraphicsData & GridLineGraphicsState

function positionPoint(
    { axis, position }: GridLineData
): PlaneVector {
    return axis === PlaneAxis.X ? [0, position] : [position, 0]
}
function lineToEndPoint(
    { axis, length }: GridLineData
): PlaneVector {
    return axis === PlaneAxis.X ? [length, 0] : [0, length]
}
function labelPositionPoint(
    { axis }: GridLineData
): PlaneVector {
    return axis === PlaneAxis.X ? [8, 4] : [4, 8]
}
function move(
    line: GridLineGraphics,
): void {
    const { graphics } = line
    graphics.position.set(...positionPoint(line))
}
function draw(
    line: GridLineGraphics,
): void {
    const { width, color, graphics } = line
    graphics
        .clear()
        .lineStyle(width, color)
        .lineTo(...lineToEndPoint(line))
}
function refreshText(
    line: GridLineGraphics,
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
    line: GridLineGraphics,
): void {
    const { graphics, alpha } = line
    graphics.alpha = alpha
}

export function updateGridLineGraphics(
    line: GridLineGraphics,
    data: GridLineGraphicsData,
): void {
    const needDraw = someDiffProperties(line, data, ['label', 'length', 'color', 'width'])
    const needMove = needDraw || someDiffProperties(line, data, ['position'])
    const needRefreshAlpha = needDraw || someDiffProperties(line, data, ['alpha'])
    const needRefreshText = someDiffProperties(line, data, ['label'])
    Object.assign(line, data)
    if (needMove) move(line)
    if (needDraw) draw(line)
    if (needRefreshText) refreshText(line)
    if (needRefreshAlpha) refreshAlpha(line)
}
export function initGridLineGraphics(
    data: GridLineGraphicsData
): GridLineGraphics {
    const res: GridLineGraphics = { ...data, graphics: new Graphics() }
    move(res)
    draw(res)
    refreshText(res)
    refreshAlpha(res)
    return res
}
