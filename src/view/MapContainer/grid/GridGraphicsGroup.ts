import { Container } from "pixi.js"
import { KeyofWithType } from "../../../Type"
import { MapDiff, twoMapsDiff } from "../../../utils/collection"
import { GridLineData, GridData } from "./GridData"
import { getGraphicsStyle } from "./GridGraphicsStyle"
import { GridLineGraphics, initGridLineGraphics, updateGridLineGraphics } from "./GridLineGraphics"

type GridLineGraphicsMap = Map<number, GridLineGraphics>
export type GridGraphicsGroup = {
    data: GridData
    horizontalGraphics: GridLineGraphicsMap
    verticalGraphics: GridLineGraphicsMap
    container: Container
}

function addLineGraphics(
    { container }: GridGraphicsGroup,
    map: GridLineGraphicsMap,
    positions: Iterable<readonly [number, GridLineData]>,
    data: GridData,
): void {
    for (let [p, line] of positions) {
        const graphics = initGridLineGraphics({ ...line, ...getGraphicsStyle(line, data) })
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
        updateGridLineGraphics(map.get(p)!, { ...line, ...getGraphicsStyle(line, data) })
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
    selector: KeyofWithType<GridGraphicsGroup, GridLineGraphicsMap>,
    update: MapDiff<number, GridLineData>,
    data: GridData,
): void {
    const { addition: added, deletion: removed, update: updated } = update
    addLineGraphics(group, group[selector], added, data)
    updateLineGraphics(group[selector], updated, data)
    removeLineGraphics(group, group[selector], removed.keys())
}

export function updateGridGraphicsGroup(
    group: GridGraphicsGroup,
    data: GridData,
): void {
    const horizontalUpdate = twoMapsDiff(group.data.horizontalLines, data.horizontalLines)
    const verticalUpdate = twoMapsDiff(group.data.verticalLines, data.verticalLines)
    updateGraphicsMap(group, 'horizontalGraphics', horizontalUpdate, data)
    updateGraphicsMap(group, 'verticalGraphics', verticalUpdate, data)
    group.data = data
}
export function initGridGraphicsGroup(
    data: GridData,
    container: Container,
): GridGraphicsGroup {
    return {
        data,
        horizontalGraphics: new Map(),
        verticalGraphics: new Map(),
        container,
    }
}
