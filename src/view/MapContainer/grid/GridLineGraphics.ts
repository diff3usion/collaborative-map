import { Graphics, Text } from "pixi.js"
import { PlaneVector } from "../../../Type"
import { GridLineData } from "./GridData"

export interface GridLineDynamicStyle {
    dimming?: number,
    label?: string
}
export interface GridLineGraphicsStyle extends GridLineDynamicStyle {
    width: number
    color: number
    alpha: number
}
export interface GridLineGraphicsData extends GridLineData, GridLineGraphicsStyle { }
export type GridLineGraphics = {
    data: GridLineGraphicsData
    graphics: Graphics
    labelText?: Text
}

function positionPoint(
    { isHorizontal, position }: GridLineData
): PlaneVector {
    return isHorizontal ? [0, position] : [position, 0]
}
function lineToEndPoint(
    { isHorizontal, length }: GridLineData
): PlaneVector {
    return isHorizontal ? [length, 0] : [0, length]
}
function labelPositionPoint(
    { isHorizontal }: GridLineData
): PlaneVector {
    return isHorizontal ? [8, 4] : [4, 8]
}
function refreshText(
    line: GridLineGraphics,
): void {
    const { data, graphics, labelText } = line
    const { alpha, label } = data
    if (!label || label !== labelText?.text) {
        graphics.removeChildren()
        labelText?.destroy()
        line.labelText = undefined
        if (label) {
            line.labelText = new Text(label, { fontSize: 16 })
            line.labelText.alpha = alpha
            line.labelText.position.set(...labelPositionPoint(data))
            graphics.addChild(line.labelText)
        }
    }
}
function draw(
    line: GridLineGraphics,
): GridLineGraphics {
    const { data, graphics } = line
    const { width, color } = data
    graphics
        .clear()
        .lineStyle(width, color)
        .lineTo(...lineToEndPoint(data))
        .lineStyle(0)
        .beginFill(color)
        .endFill()
    refreshText(line)
    return line
}
function move(
    line: GridLineGraphics,
): GridLineGraphics {
    const { data, graphics } = line
    graphics.position.set(...positionPoint(data))
    return line
}

export function updateGridLineGraphics(
    line: GridLineGraphics,
    data: GridLineGraphicsData,
): void {
    const { data: prev } = line
    const { position, length, width, color, label } = data
    const needDraw = prev.label !== label
        || prev.length !== length
        || prev.color !== color
        || prev.width !== width
    const needMove = needDraw || prev.position !== position
    line.data = data
    if (needDraw) draw(line)
    if (needMove) move(line)
}
export function initGridLineGraphics(
    data: GridLineGraphicsData
): GridLineGraphics {
    const graphics = new Graphics()
    const res = { data, graphics }
    draw(move(res))
    return res
}
