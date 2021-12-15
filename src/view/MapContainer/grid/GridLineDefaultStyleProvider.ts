
import { GridData, GridLineData } from "./GridData"
import { GridLineGraphics, GridLineStyleProvider } from "./GridLineGraphics"

export module GridLineDefaultStyleProvider {
    const labelOffset = 32
    export enum LineType {
        AxisLine,
        TopLevelLine,
        MajorLine,
        MinorLine,
    }
    export type Template = Record<LineType, GridLineGraphics.Style>
    export const defaultTemplate: Template = {
        [LineType.AxisLine]: {
            width: 4,
            color: 0x888888,
            alpha: 0.6
        },
        [LineType.TopLevelLine]: {
            width: 3,
            color: 0x999999,
            alpha: 0.5
        },
        [LineType.MajorLine]: {
            width: 2,
            color: 0x999999,
            alpha: 0.5
        },
        [LineType.MinorLine]: {
            width: 1,
            color: 0xAAAAAA,
            alpha: 0.4
        },
    }

    function getStyleType(
        line: GridLineData,
        grid: GridData,
    ): LineType {
        const { position } = line
        const { maxLineGap, gap } = grid
        if (position === 0) return LineType.AxisLine
        if (position % maxLineGap === 0) return LineType.TopLevelLine
        if (gap === 0 || (position / gap) % 2 === 0) return LineType.MajorLine
        return LineType.MinorLine
    }
    function getStyleLabel(
        { position }: GridData.Line,
        type: LineType,
        { transformedPosition }: GridLineGraphics.TransformedData,
    ): string | undefined {
        const canFitLabel = transformedPosition > labelOffset
        return type !== LineType.MinorLine && canFitLabel ? `${position}` : undefined
    }

    export function get(
        template = defaultTemplate
    ): GridLineStyleProvider {
        return (line, grid, relativeData,
        ) => {
            const type = getStyleType(line, grid)
            const label = getStyleLabel(line, type, relativeData)
            return { ...template[type], label, ...relativeData }
        }
    }
}
