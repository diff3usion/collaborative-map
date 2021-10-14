import { GridData } from "./GridData"
import { GridLineGraphics } from "./GridLineGraphics"

enum StyleType {
    AxisLine,
    TopLevelLine,
    MajorLine,
    MinorLine,
}

const labelOffset = 32
const styleTemplates: Record<StyleType, GridLineGraphics.Style> = {
    [StyleType.AxisLine]: {
        width: 4,
        color: 0x888888,
        alpha: 0.6
    },
    [StyleType.TopLevelLine]: {
        width: 3,
        color: 0x999999,
        alpha: 0.5
    },
    [StyleType.MajorLine]: {
        width: 2,
        color: 0x999999,
        alpha: 0.5
    },
    [StyleType.MinorLine]: {
        width: 1,
        color: 0xAAAAAA,
        alpha: 0.4
    },
}

function getStyleType(
    line: GridData.Line,
    grid: GridData.Obj,
): StyleType {
    const { position } = line
    const { maxLineGap, gap } = grid
    if (position === 0) return StyleType.AxisLine
    if (position % maxLineGap === 0) return StyleType.TopLevelLine
    if (gap === 0 || (position / gap) % 2 === 0) return StyleType.MajorLine
    return StyleType.MinorLine
}
function getStyleLabel(
    { position }: GridData.Line,
    type: StyleType,
    { relativePosition }: GridLineGraphics.RelativeData,
): string | undefined {
    const canFitLabel = relativePosition > labelOffset
    return type !== StyleType.MinorLine && canFitLabel ? `${position}` : undefined
}

export function getGridLineStyle(
    line: GridData.Line,
    grid: GridData.Obj,
    relativeData: GridLineGraphics.RelativeData,
): GridLineGraphics.Style {
    const type = getStyleType(line, grid)
    const label = getStyleLabel(line, type, relativeData)
    const template = styleTemplates[type]
    return { ...template, label, ...relativeData }
}
