import { Container } from "pixi.js"
import { PlaneAxis } from "../../../type/geometry"
import { Overwrite } from "../../../type/object"
import { fromAxis } from "../../../utils/object"
import { GridData } from "./GridData"
import { GridLineGraphics } from "./GridLineGraphics"

type GridLineGraphicsMap = Map<number, GridLineGraphics.Obj>

export module GridGraphicsGroup {
    type Options = Readonly<{
        container: Container
    }>
    type AxisMaps = Record<PlaneAxis, GridLineGraphicsMap>
    export type Obj = Overwrite<GridData.Obj, AxisMaps> & Options

    export function add(
        group: Obj,
        axis: PlaneAxis,
        graphics: GridLineGraphics.Obj,
    ): void {
        group[axis].set(graphics.position, graphics)
        group.container.addChild(graphics.graphics)
    }
    export function update(
        group: Obj,
        axis: PlaneAxis,
        data: GridLineGraphics.Data,
    ): void {
        GridLineGraphics.update(
            group[axis].get(data.position)!,
            data,
        )
    }
    export function remove(
        group: Obj,
        axis: PlaneAxis,
        position: number,
    ): void {
        const graphics = group[axis].get(position)
        if (graphics) {
            const g = graphics.graphics
            group.container.removeChild(g)
            g.destroy()
            group[axis].delete(graphics.position)
        }
    }
    export function init(
        data: GridData.Obj,
        container: Container,
    ): Obj {
        return {
            ...data,
            ...fromAxis(_ => new Map()),
            container,
        }
    }
}
