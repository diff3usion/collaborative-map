import { PlaneVector, PlaneRect, PlaneSize } from "../../../Type"

type OverlayStyle = {
    isFilled: boolean
    hasBorder: boolean
    borderColor?: number
    borderAlpha?: number
    filledColor?: number
    filledAlpha?: number
}

type NonAreaStyle = {
    color: number
    alpha: number
}

const styleFromNonAreaStyle: (style: NonAreaStyle) => OverlayStyle
    = ({ color, alpha }) => ({
        isFilled: false,
        hasBorder: true,
        borderColor: color,
        borderAlpha: alpha
    })

abstract class MarkerOverlay {
    style: OverlayStyle
    constructor(style: OverlayStyle) {
        this.style = style
    }
}

class Pin extends MarkerOverlay {
    pos: PlaneVector
    constructor(pos: PlaneVector, style: NonAreaStyle) {
        super(styleFromNonAreaStyle(style))
        this.pos = pos
    }
}

class Path extends MarkerOverlay {
    nodes: PlaneVector[]
    constructor(nodes: PlaneVector[], style: NonAreaStyle) {
        super(styleFromNonAreaStyle(style))
        this.nodes = nodes
    }
}

class Rect extends MarkerOverlay {
    rect: PlaneRect
    constructor(rect: PlaneRect, style: OverlayStyle) {
        super(style)
        this.rect = rect
    }
}

class Ellipse extends MarkerOverlay {
    center: PlaneVector
    size: PlaneSize
    constructor(center: PlaneVector, size: PlaneSize, style: OverlayStyle) {
        super(style)
        this.center = center
        this.size = size
    }
}

class Polygon extends MarkerOverlay {
    nodes: PlaneVector[]
    constructor(nodes: PlaneVector[], style: OverlayStyle) {
        super(style)
        this.nodes = nodes
    }
}

