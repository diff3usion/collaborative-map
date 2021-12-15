import { PlaneVector, PlaneSize } from "./plane"

export type Viewport = {
    position: PlaneVector
    scale: number
}
export type SizedViewport = {
    size: PlaneSize,
    viewport: Viewport,
}
