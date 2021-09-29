import { GridData, GridLineData } from "./GridData"
import { GridLineGraphicsStyle } from "./GridLineGraphics"

enum StyleType {
    AxisLine,
    TopLevelLine,
    MajorLine,
    MinorLine,
}

const labelOffset = 32
const styleTemplates: Record<StyleType, GridLineGraphicsStyle> = {
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
    line: GridLineData,
    grid: GridData,
): StyleType {
    const { relativePosition } = line
    const { maxLineGap, gap } = grid
    if (relativePosition === 0) return StyleType.AxisLine
    if (relativePosition % maxLineGap === 0) return StyleType.TopLevelLine
    if (gap === 0 || (relativePosition / gap) % 2 === 0) return StyleType.MajorLine
    return StyleType.MinorLine
}
function getStyleLabel(
    line: GridLineData,
    type: StyleType,
): string | undefined {
    const { position, relativePosition } = line
    const canFitLabel = position > labelOffset
    return type !== StyleType.MinorLine && canFitLabel ? `${relativePosition}` : undefined
}

export function getGridLineStyle(
    line: GridLineData,
    grid: GridData,
): GridLineGraphicsStyle {
    const type = getStyleType(line, grid)
    const label = getStyleLabel(line, type)
    const template = styleTemplates[type]
    return { ...template, label }
}
