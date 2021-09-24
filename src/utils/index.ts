import { InteractionEvent, Point } from "pixi.js";
import { isFirefox } from 'react-device-detect';
import { PlaneVector, Viewport } from "../Type";

export const bytesToNumber: (bytes: Uint8Array, index: number, size: number) => number
    = (bytes, index, size) => {
        let res = 0
        for (let i = 0; i < size; i++)
            res += bytes[index + i] << 8 * i
        return res
    }

export const numberToBytes: (value: number, bytes: Uint8Array, index: number, size: number) => void
    = (value, bytes, index, size) => {
        for (let i = 0; i < size; i++)
            bytes[index + i] = (value >> 8 * i) & 0b1111_1111
    }

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

// export const eventToGlobalPosition: (e: InteractionEvent) => PlaneVector
//     = ({ data: { global: { x, y } } }) => [x, y]

export const eventToTargetRelativePosition: (e: InteractionEvent) => PlaneVector
    = ({ currentTarget: { position: { x, y } } }) => [x, y]

export const globalToRelativePosition: (globalPosition: PlaneVector, viewport: Viewport) => PlaneVector
    = ([globalX, globalY], { position: [posX, posY], scale }) =>
        [(globalX - posX) / scale, (globalY - posY) / scale]

export const relativeToGlobalPosition: (relativePosition: PlaneVector, viewport: Viewport) => PlaneVector
    = ([relativeX, relativeY], { position: [posX, posY], scale }) =>
        [relativeX * scale + posX, relativeY * scale + posY]

export const nearestSmallerPowerOf2 = (n: number) =>
    2 << (31 - Math.clz32(n))

export const pointToVector: (p: Point) => PlaneVector
    = p => [p.x, p.y]

export function boundedNumber(lower: number, upper: number, n: number): number {
    return Math.max(lower, Math.min(upper, n))
}

export function pickProperties<T extends Object, F extends (keyof T)[]>(obj: T, ...keys: F): Pick<T, F[number]> {
    return keys.reduce((a, x) => {
        if (obj.hasOwnProperty(x)) a[x] = obj[x];
        return a;
    }, {} as Partial<T>) as Pick<T, F[number]>
}
