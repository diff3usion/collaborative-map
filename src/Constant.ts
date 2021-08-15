import { MapControlMode, MapMarkingMode } from "./Type"
import { TwoWayMap } from "./utils"

export const markingTypeKeyHeader = 'marking_type'
export const markingTypeKeyPoint = 'marking_point'
export const markingTypeKeyPath = 'marking_path'
export const markingTypeKeyRect = 'marking_rect'
export const markingTypeKeyPolygon = 'marking_polygon'
export const markingTypeKeyEllipse = 'marking_ellipse'

export const markingTypeDropdownKeyMap = new TwoWayMap(new Map([
    [markingTypeKeyPoint, MapMarkingMode.Point],
    [markingTypeKeyPath, MapMarkingMode.Path],
    [markingTypeKeyRect, MapMarkingMode.Rect],
    [markingTypeKeyPolygon, MapMarkingMode.Polygon],
    [markingTypeKeyEllipse, MapMarkingMode.Ellipse],
]))

export const markingTypeMaxPointsMap = new Map([
    [MapMarkingMode.Point, 1],
    [MapMarkingMode.Path, Infinity],
    [MapMarkingMode.Rect, 2],
    [MapMarkingMode.Polygon, Infinity],
    [MapMarkingMode.Ellipse, 2],
])

export const controlModeCursorStyles: Map<MapControlMode, string> = new Map([
    [MapControlMode.Explore, 'grab'],
    [MapControlMode.Marking, 'crosshair'],
    [MapControlMode.Uploads, 'auto'],
])
