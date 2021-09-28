import { Container } from "pixi.js"
import { KeyofWithType, PlaneAxis } from "../../../Type"
import { MapDiff, twoMapsDiff } from "../../../utils/collection"
import { GridLineData, GridData, GridMaps, diffGridMaps } from "./GridData"
import { getGridLineStyle } from "./GridLineStyleTemplates"
import { GridLineGraphics, GridLineGraphicsData, initGridLineGraphics, updateGridLineGraphics } from "./GridLineGraphics"

type GridLineGraphicsMap = Map<number, GridLineGraphics>
type GridGraphicsMaps = Record<PlaneAxis, GridLineGraphicsMap>
export type GridGraphicsGroup = GridGraphicsMaps & {
    data: GridData
    container: Container
}

function addLineGraphics(
    { container }: GridGraphicsGroup,
    map: GridLineGraphicsMap,
    positions: Iterable<readonly [number, GridLineData]>,
    data: GridData,
): void {
    for (let [p, line] of positions) {
        const graphics = initGridLineGraphics({ ...line, ...getGridLineStyle(line, data) })
        map.set(p, graphics)
        container.addChild(graphics.graphics)
    }
}
function updateLineGraphics(
    map: GridLineGraphicsMap,
    positions: Iterable<readonly [number, [GridLineData, GridLineData]]>,
    data: GridData,
): void {
    for (let [p, [_, line]] of positions)
        updateGridLineGraphics(map.get(p)!, { ...line, ...getGridLineStyle(line, data) })
}
function removeLineGraphics(
    { container }: GridGraphicsGroup,
    map: GridLineGraphicsMap,
    positions: Iterable<number>,
): void {
    for (let p of positions) {
        const graphics = map.get(p)
        if (graphics) {
            const g = graphics.graphics
            container.removeChild(g)
            g.destroy()
            map.delete(p)
        }
    }
}
function updateGraphicsMap(
    group: GridGraphicsGroup,
    axis: PlaneAxis,
    update: MapDiff<number, GridLineData>,
    data: GridData,
): void {
    const { addition: added, deletion: removed, update: updated } = update
    addLineGraphics(group, group[axis], added, data)
    updateLineGraphics(group[axis], updated, data)
    removeLineGraphics(group, group[axis], removed.keys())
}

export function updateGridGraphicsGroup(
    group: GridGraphicsGroup,
    data: GridData,
): void {
    const { [PlaneAxis.X]: xUpdate, [PlaneAxis.Y]: yUpdate } = diffGridMaps(group.data, data)
    updateGraphicsMap(group, PlaneAxis.X, xUpdate, data)
    updateGraphicsMap(group, PlaneAxis.Y, yUpdate, data)
    group.data = data
}
export function initGridGraphicsGroup(
    data: GridData,
    container: Container,
): GridGraphicsGroup {
    return {
        data,
        [PlaneAxis.X]: new Map(),
        [PlaneAxis.Y]: new Map(),
        container,
    }
}
