import { PlaneVector, Viewport } from "../type/geometry";

export const eventToClientPlaneVector: (event: { clientX: number, clientY: number }) => PlaneVector
    = e => [e.clientX, e.clientY]

export const eventToPosition: (event: MouseEvent) => PlaneVector
    = e => {
        if (e.offsetX) return [e.offsetX, e.offsetY]
        if (e.target) {
            const target = e.target as HTMLElement
            var mozLeft = e.clientX - target.offsetLeft
            var mozTop = e.clientY - target.offsetTop
            var parent = target.offsetParent as HTMLElement
            while (parent) {
                mozLeft = mozLeft - parent.offsetLeft;
                mozTop = mozTop - parent.offsetTop;
                parent = parent.offsetParent as HTMLElement
            }
            return [mozLeft, mozTop]
        }
        return [0, 0]
    }

export const globalToRelativePosition: (globalPosition: PlaneVector, viewport: Viewport) => PlaneVector
    = ([globalX, globalY], { position: [posX, posY], scale }) =>
        [(globalX - posX) / scale, (globalY - posY) / scale]

export const relativeToGlobalPosition: (relativePosition: PlaneVector, viewport: Viewport) => PlaneVector
    = ([relativeX, relativeY], { position: [posX, posY], scale }) =>
        [relativeX * scale + posX, relativeY * scale + posY]
