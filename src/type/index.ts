type TypeEquals<T, F, Y = true, N = false> =
    T extends F ? F extends T ? Y : N : N

export interface AnimationOptions {
    duration: number,
}

export enum MapControlMode {
    Explore,
    Marking,
    Uploads,
}

export enum MapMarkingMode {
    Point,
    Path,
    Rect,
    Polygon,
    Ellipse,
}

export enum MapMarkingStage {
    Drawing,
    Specifying,
}
