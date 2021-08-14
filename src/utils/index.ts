import _ from "lodash";
import { Point } from "pixi.js";
import { isFirefox } from 'react-device-detect';
import { PlaneVector, Viewport } from "../Type";


export class TwoWayMap<K, V> implements Map<K, V>{
    private map: Map<K, V>
    private reverseMap: Map<V, K>

    constructor(map?: Map<K, V>) {
        this.map = new Map()
        this.reverseMap = new Map()
        if (map) map.forEach((v, k) => this.set(k, v))
    }
    get: (k: K) => V | undefined
        = k => this.map.get(k)
    reverseGet: (k: V) => K | undefined
        = k => this.reverseMap.get(k)
    has: (k: K) => boolean
        = k => this.map.has(k)
    reverseHas: (v: V) => boolean
        = v => this.reverseMap.has(v)
    delete: (k: K) => boolean
        = k => {
            const v = this.map.get(k)
            if (v) this.reverseMap.delete(v)
            return this.map.delete(k)
        }
    reverseDelete: (v: V) => boolean
        = v => {
            const k = this.reverseMap.get(v)
            if (k) this.map.delete(k)
            return this.reverseMap.delete(v)
        }
    set: (k: K, v: V) => this = (k, v) => {
        this.map.set(k, v)
        this.reverseMap.set(v, k)
        return this
    }

    get size(): number {
        return this.map.size
    }
    get [Symbol.toStringTag](): string {
        return this.map[Symbol.toStringTag];
    }
    [Symbol.iterator]: () => IterableIterator<[K, V]> = () => this.map[Symbol.iterator]()
    clear: () => void
        = () => {
            this.map.clear()
            this.reverseMap.clear()
        }
    forEach: (callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any) => void
        = (callbackfn, thisArg) => this.map.forEach(callbackfn, thisArg)
    entries: () => IterableIterator<[K, V]>
        = () => this.map.entries()
    keys: () => IterableIterator<K>
        = () => this.map.keys()
    values: () => IterableIterator<V>
        = () => this.map.values()
}

export const fillArray: <T>(length: number, value: T) => T[]
    = (length, value) => new Array(length).fill(0).map(() => value)

export const initArray: <T>(length: number, producer: (index: number) => T) => T[]
    = (length, producer) => new Array(length).fill(0).map((_, index) => producer(index))

export const initMatrix: <T>(row: number, col: number, producer: (index?: number) => T) => T[][]
    = (row, col, producer) => initArray(row, () => initArray(col, producer))

export const initTempCanvas: (width: number, height: number) => HTMLCanvasElement
    = (width, height) => {
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = width
        tempCanvas.height = height
        return tempCanvas
    }

export const imageDataToBase64Url: (imgData: ImageData) => Promise<string>
    = async imgData => {
        const tempCanvas = initTempCanvas(imgData.width, imgData.height)
        tempCanvas.getContext("2d")!.putImageData(imgData, 0, 0)
        const reader = new FileReader()
        const blob = await new Promise<Blob>((resolve, reject) =>
            tempCanvas.toBlob(b => b ? resolve(b) : reject(b)))
        reader.readAsDataURL(blob)
        return new Promise<string>((resolve, reject) => {
            reader.onload = _ =>
                reader.result ? resolve(reader.result! as string) : reject()
            reader.onerror = reject
        })
    }

export const imgElementToImageData: (img: HTMLImageElement) => ImageData
    = img => {
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = img.width
        tempCanvas.height = img.height
        const context = tempCanvas.getContext('2d')!
        context.drawImage(img, 0, 0)
        tempCanvas.remove()
        return context.getImageData(0, 0, img.width, img.height)
    }

export const imageUrlToImgElement: (url: string, width: number, height: number) => HTMLImageElement
    = (url, width, height) => {
        const imgElement = document.createElement('img')
        imgElement.src = url
        imgElement.width = width
        imgElement.height = height
        return imgElement
    }

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

export const mouseEventToPlaneVector: (event: MouseEvent) => PlaneVector
    = e => {
        if (isFirefox && e.target) {
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
        } else {
            return [e.offsetX, e.offsetY]
        }
    }

export const globalToRelativePosition: (globalPosition: PlaneVector, viewport: Viewport) => PlaneVector
    = ([globalX, globalY], { position: [posX, posY], scale }) =>
        [(globalX - posX) / scale, (globalY - posY) / scale]

export const relativeToGlobalPosition: (globalPosition: PlaneVector, viewport: Viewport) => PlaneVector
    = ([relativeX, relativeY], { position: [posX, posY], scale }) =>
        [relativeX * scale + posX, relativeY * scale + posY]

export const nearestSmallerPowerOf2 = (n: number) =>
    2 << (31 - Math.clz32(n))

export const pointToVector: (p: Point) => PlaneVector
    = p => [p.x, p.y]

export const mapFilter: <K, V>(map: Map<K, V>, predicate: (k: K, v: V) => boolean) => Map<K, V>
    = (map, predicate) => {
        const res = new Map()
        map.forEach((v, k) => {
            if (predicate(k, v)) res.set(k, v)
        })
        return res
    }

export const mapPartition: <K, V>(map: Map<K, V>, predicate: (k: K, v: V) => boolean) => [Map<K, V>, Map<K, V>]
    = <K, V>(map: Map<K, V>, predicate: (k: K, v: V) => boolean) => {
        const res = [new Map(), new Map()] as [Map<K, V>, Map<K, V>]
        map.forEach((v, k) => (predicate(k, v) ? res[0] : res[1]).set(k, v))
        return res
    }

export const boundedNumber = (lower: number, upper: number, n: number) => Math.max(lower, Math.min(upper, n))


export const stringToArray = (s: string) => {
    const res = new Uint8Array(new ArrayBuffer(s.length * 1))
    res.forEach((_, i) => res[i] = s.charCodeAt(i))
    return res
}
