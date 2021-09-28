import { MapControlMode, MapMarkingMode } from "./Type"
import { TwoWayMap } from "./utils/collection"

export const markingTypeKeyHeader = 'marking_type'
export const markingTypeKeyPoint = 'marking_point'
export const markingTypeKeyPath = 'marking_path'
export const markingTypeKeyRect = 'marking_rect'
export const markingTypeKeyPolygon = 'marking_polygon'
export const markingTypeKeyEllipse = 'marking_ellipse'

export const markingTypeDropdownKeyMap = TwoWayMap.from([
    [markingTypeKeyPoint, MapMarkingMode.Point],
    [markingTypeKeyPath, MapMarkingMode.Path],
    [markingTypeKeyRect, MapMarkingMode.Rect],
    [markingTypeKeyPolygon, MapMarkingMode.Polygon],
    [markingTypeKeyEllipse, MapMarkingMode.Ellipse],
])

export const markingTypeMaxPointsMap: Record<MapMarkingMode, number> = {
    [MapMarkingMode.Point]: 1,
    [MapMarkingMode.Path]: Infinity,
    [MapMarkingMode.Rect]: 2,
    [MapMarkingMode.Polygon]: Infinity,
    [MapMarkingMode.Ellipse]: 2,
}

export const controlModeCursorStyles: Record<MapControlMode, string> = {
    [MapControlMode.Explore]: 'grab',
    [MapControlMode.Marking]: 'crosshair',
    [MapControlMode.Uploads]: 'auto',
}
