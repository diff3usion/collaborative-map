import { Container } from "pixi.js"
import { PlaneAxis } from "../../../Type"
import { GridData, GridMaps } from "./GridData"
import { GridLineGraphics, GridLineGraphicsData, updateGridLineGraphics } from "./GridLineGraphics"

type GridGraphicsGroupOptions = Readonly<{
    container: Container
}>
type GridLineGraphicsMap = Map<number, GridLineGraphics>
type GridGraphicsMaps = Record<PlaneAxis, GridLineGraphicsMap>
export type GridGraphicsGroup = Omit<GridData, keyof GridMaps> & GridGraphicsMaps & GridGraphicsGroupOptions

export function gridGraphicsGroupAdd(
    group: GridGraphicsGroup,
    axis: PlaneAxis,
    graphics: GridLineGraphics,
): void {
    group[axis].set(graphics.relativePosition, graphics)
    group.container.addChild(graphics.graphics)
}
export function gridGraphicsGroupUpdate(
    group: GridGraphicsGroup,
    axis: PlaneAxis,
    data: GridLineGraphicsData,
): void {
    updateGridLineGraphics(
        group[axis].get(data.relativePosition)!,
        data,
    )
}
export function gridGraphicsGroupRemove(
    group: GridGraphicsGroup,
    axis: PlaneAxis,
    position: number,
): void {
    const graphics = group[axis].get(position)
    if (graphics) {
        const g = graphics.graphics
        group.container.removeChild(g)
        g.destroy()
        group[axis].delete(graphics.relativePosition)
    }
}

export function initGridGraphicsGroup(
    data: GridData,
    container: Container,
): GridGraphicsGroup {
    return {
        ...data,
        [PlaneAxis.X]: new Map(),
        [PlaneAxis.Y]: new Map(),
        container,
    }
}
