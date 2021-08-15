import { mergeMap, from, filter } from "rxjs";
import { VoxelRegionZipFiles$ } from "../App";
import { RenderedRegion$ } from "../store/MapData";
import { PlaneSize, PlaneVector } from "../Type";
import { bytesToNumber, imageDataToBase64Url, initArray } from "../utils";
import { getBlockMeta, getLocationMeta, getBlockState, regionsOfRect, loadVoxelMapCacheFile, renderLoadedRegion, getRegionTime, getRegionRect, loadMcMapColorTable } from "model";

export class BlockState {
    constructor(
        readonly namespace: string,
        readonly id: string,
        readonly args: { [key: string]: string },
    ) { }

    get stringified() {
        return `${this.namespace}:${this.id}${Object.keys(this.args).length ? `[${Object.entries(this.args).map(([k, v]) => `${k}=${v}`).join(',')}]` : ''}`
    }

    private static stringFormat = /(\w+)\:(\w+)(?:\[(.+)\])*/
    static parse: (stringified: string) => BlockState | undefined
        = s => {
            const capture = BlockState.stringFormat.exec(s)
            if (!capture || (capture.length !== 4 && capture.length !== 5))
                return undefined
            const namespace = capture[1]
            const id = capture[2]
            const args: { [key: string]: string } = Object.fromEntries(
                capture[3].split(',').map(arg => arg.split('=') as [string, string])
            )
            return new BlockState(namespace, id, args)
        }
}

export class MapBlock {
    constructor(
        readonly id: number,
        readonly x: number,
        readonly z: number,
        readonly i: number,
    ) { }

    private get meta() {
        return getBlockMeta(this.id, this.x, this.z, this.i)
    }

    get state(): BlockState | undefined {
        const meta = this.meta
        if (!meta) return undefined
        const key = bytesToNumber(meta, 0, 2)
        const stringified = getBlockState(key)
        if (!stringified) return undefined
        return BlockState.parse(stringified)
    }
    get height(): number | undefined {
        const meta = this.meta
        if (!meta) return undefined
        return bytesToNumber(meta, 2, 2)
    }
    get blockLight(): number | undefined {
        const meta = this.meta
        if (!meta) return undefined
        return bytesToNumber(meta, 4, 1) >> 4
    }
    get skyLight(): number | undefined {
        const meta = this.meta
        if (!meta) return undefined
        return bytesToNumber(meta, 4, 1) && 0b1111
    }
}

export class MapLocation {
    constructor(
        readonly id: number,
        readonly x: number,
        readonly z: number,
    ) { }

    private get meta() {
        return getLocationMeta(this.id, this.x, this.z)
    }

    get size(): number | undefined {
        const meta = this.meta
        if (!meta) return undefined
        return bytesToNumber(meta, 0, 2)
    }

    get biomeId(): number | undefined {
        const meta = this.meta
        if (!meta) return undefined
        return bytesToNumber(meta, 2, 2)
    }

    block(index: number) {
        return new MapBlock(this.id, this.x, this.z, index)
    }

    get blocks() {
        return initArray(this.size!, i => new MapBlock(this.id, this.x, this.z, i))
    }
}

export class MapRegion {
    public url: string = ""
    constructor(
        readonly id: number,
        readonly position: PlaneVector,
        readonly size: PlaneSize,
        readonly date: Date,
    ) { }

    location(x: number, z: number) {
        return new MapLocation(this.id, x, z)
    }
}

export const locationOfPosition: (position: PlaneVector) => MapLocation | undefined
    = ([x, z]) => {
        const targetRegion = regionsOfRect(x, z, 1, 1)[0]
        if (targetRegion === undefined) return undefined
        const [rx, rz, rw, rh] = Array.from(getRegionRect(targetRegion)!)
        if (!isPointInRect([x, z], [[rx, rz], [rw, rh]])) return undefined
        return new MapLocation(targetRegion, x - rx, z - rz)
    }

const renderedToImageData: (rendered: Uint8Array, width: number, height: number) => ImageData
    = (rendered, width, height) =>
        new ImageData(new Uint8ClampedArray(rendered), width, height)
const isZipFile: (file: File) => boolean
    = file => file.type === "application/x-zip-compressed"

import json from './map/renderer/map_color_table.json'
import { isPointInRect } from "../utils/geometry";
loadMcMapColorTable(JSON.stringify(json))
VoxelRegionZipFiles$
    .pipe(
        mergeMap(fileList =>
            from(fileList).pipe(
                filter(isZipFile),
            )
        ),
        mergeMap(file => {
            const fileReader = new FileReader()
            fileReader.readAsArrayBuffer(file)
            return new Promise<[ProgressEvent<FileReader>, File]>((resolve, reject) => {
                fileReader.onload = e => resolve([e, file])
                fileReader.onerror = reject
            })
        }),
        mergeMap(async ([event, file]) => {
            const r = event.target!.result as ArrayBuffer
            const id = loadVoxelMapCacheFile(file.name, BigInt(file.lastModified), new Uint8Array(r))
            const rendered = renderLoadedRegion(id)
            const time = Number(getRegionTime(id))
            const [x, y, w, h] = Array.from(getRegionRect(id)!)
            console.log([x, y, w, h])
            const res = new MapRegion(
                id,
                [x, y],
                [w, h],
                new Date(time)
            )
            const imageData = renderedToImageData(rendered, w, h)
            res.url = await imageDataToBase64Url(imageData)
            return res
        })
    ).subscribe(RenderedRegion$)
