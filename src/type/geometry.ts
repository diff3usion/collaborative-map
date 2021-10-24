export type PlaneVector = [number, number]
export type PlaneSize = [number, number]
export type PlaneRect = [PlaneVector, PlaneSize]
export type PlanePath = PlaneVector[]
export type PlaneEllipse = [PlaneVector, PlaneVector]
export type PlanePolygon = PlaneVector[]
export type PlaneLineSegment = [PlaneVector, PlaneVector]
export enum PlaneAxis {
    X = 0,
    Y = 1,
}
export type PerAxis<T> = Record<PlaneAxis, T>
export type Viewport = {
    position: PlaneVector
    scale: number
}
export type SizedViewport = {
    size: PlaneSize,
    viewport: Viewport,
}
