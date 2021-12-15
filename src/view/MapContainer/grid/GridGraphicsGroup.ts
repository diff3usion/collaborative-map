import * as PIXI from "pixi.js"
import { PlaneAxis, PlaneTransformation } from "../../../type/plane"
import { Overwrite } from "../../../type/object"
import { twoMapsDiff } from "../../../utils/collection"
import { axisInverted, planeVectorTransform, planeVectorAligned, fromAxis } from "../../../utils/plane"
import { vectorNorm } from "../../../utils/math"

import { GridData } from "./GridData"
import { GridLineDefaultStyleProvider } from "./GridLineDefaultStyleProvider"
import { GridLineGraphics, GridLineStyleProvider } from "./GridLineGraphics"

type GridLineGraphicsMap = Map<number, GridLineGraphics>
export type GridGraphicsGroup = GridGraphicsGroup.Obj

export module GridGraphicsGroup {
    type AxisMaps = Record<PlaneAxis, GridLineGraphicsMap>
    export type Props = Overwrite<GridData, AxisMaps>
    export type State = Readonly<{
        container: PIXI.Container
    }>
    export type Obj = Props & State
    export function add(
        group: GridGraphicsGroup,
        axis: PlaneAxis,
        graphics: GridLineGraphics,
    ): void {
        group[axis].set(graphics.position, graphics)
        group.container.addChild(graphics.graphics)
    }
    export function updateGridLine(
        group: GridGraphicsGroup,
        axis: PlaneAxis,
        data: GridLineGraphics.Props,
    ): void {
        GridLineGraphics.update(
            group[axis].get(data.position)!,
            data,
        )
    }
    export function remove(
        group: GridGraphicsGroup,
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
    function transformLineData(
        trans: PlaneTransformation,
        { length, position, axis }: GridData.Line,
    ): GridLineGraphics.TransformedData {
        const transformedPosition = planeVectorTransform(
            trans,
            planeVectorAligned(axisInverted(axis), position),
        )[axisInverted(axis)]
        const transformedLength = vectorNorm(planeVectorTransform(
            trans,
            planeVectorAligned(axis, 1),
        )) * length
        return { transformedPosition, transformedLength }
    }
    function updateAxis(
        axis: PlaneAxis,
        group: GridGraphicsGroup,
        data: GridData,
        trans: PlaneTransformation,
        styleProvider: GridLineStyleProvider,
    ): void {
        const { addition, deletion, update } = twoMapsDiff(group[axis], data[axis])
        for (let line of addition.values()) {
            const relativeData = transformLineData(trans, line)
            add(group, axis, GridLineGraphics.init({ ...line, ...relativeData, ...styleProvider(line, data, relativeData) }))
        }
        for (let [_, line] of update.values()) {
            const relativeData = transformLineData(trans, line)
            updateGridLine(group, axis, { ...line, ...relativeData, ...styleProvider(line, data, relativeData) })
        }
        for (let p of deletion.keys())
            remove(group, axis, p)
    }

    export function init(
        container: PIXI.Container,
        data = GridData.init(),
    ): GridGraphicsGroup {
        return {
            ...data,
            ...fromAxis(_ => new Map()),
            container,
        }
    }
    export function update(
        group: GridGraphicsGroup,
        trans: PlaneTransformation,
        data: GridData,
        styleProvider = GridLineDefaultStyleProvider.get(),
    ): void {
        fromAxis(axis => updateAxis(axis, group, data, trans, styleProvider))
    }
}
