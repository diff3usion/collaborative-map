export enum PointerEventType {
    Move,
    Down,
    Up,
    Enter,
    Leave,
    Over,
    Out,
}

export enum EventButtonType {
    None = -1,
    Main = 0,
    Auxiliary = 1,
    Secondary = 2,
    Fourth = 3,
    Fifth = 4,
}

export enum EventButtonsBit {
    None = 0,
    Left = 1 << 0,
    Right = 1 << 1,
    Middle = 1 << 2,
    Fourth = 1 << 3,
    Fifth = 1 << 4,
}
