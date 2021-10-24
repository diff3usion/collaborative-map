import { mergeMap, from, filter, map, tap } from "rxjs";
import { PlaneSize, PlaneVector } from "../type/geometry";
import { arrayInit } from "../utils/collection";
import { imageDataToDataUrl, loadBlobAsArrayBuffer } from "../utils/dom";
import { isPointInRect } from "../utils/geometry";
import { bytesToNumber } from "../utils/math";
import json from './map/renderer/map_color_table.json'

import { voxelRegionZipFiles$ } from "../intent/VoxelMapLoader";
import { getBlockData, getLocationData, getBlockState, regionsOfRect, loadVoxelMapCacheFile, renderLoadedRegion, getRegionTime, getRegionRect, loadMcMapColorTable } from "model";
import { RenderedRegion$ } from "../store/MapData";

export class BlockState implements BlockState {
    constructor(
        readonly namespace: string,
        readonly id: string,
        readonly args: { [key: string]: string },
    ) { }

    get stringified(): string {
        return `${this.namespace}:${this.id}${Object.keys(this.args).length ? `[${Object.entries(this.args).map(([k, v]) => `${k}=${v}`).join(',')}]` : ''}`
    }

    static readonly stringFormat = /(\w+)\:(\w+)(?:\[(.+)\])*/
    static parse(stringified: string): BlockState | undefined {
        const capture = BlockState.stringFormat.exec(stringified)
        if (!capture || (capture.length !== 4 && capture.length !== 5))
            return undefined
        const namespace = capture[1]
        const id = capture[2]
        const args: { [key: string]: string } = capture[3] ? Object.fromEntries(
            capture[3].split(',').map(arg => arg.split('=') as [string, string])
        ) : {}
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

    private get data(): Uint8Array | undefined {
        return getBlockData(this.id, this.x, this.z, this.i)
    }

    get state(): BlockState | undefined {
        const data = this.data
        if (!data) return undefined
        const key = bytesToNumber(data, 0, 2)
        const stringified = getBlockState(key)
        if (!stringified) return undefined
        return BlockState.parse(stringified)
    }
    get height(): number | undefined {
        const data = this.data
        if (!data) return undefined
        return bytesToNumber(data, 2, 2)
    }
    get blockLight(): number | undefined {
        const data = this.data
        if (!data) return undefined
        return bytesToNumber(data, 4, 1) >> 4
    }
    get skyLight(): number | undefined {
        const data = this.data
        if (!data) return undefined
        return bytesToNumber(data, 4, 1) && 0b1111
    }
}

export class MapLocation {
    constructor(
        readonly id: number,
        readonly x: number,
        readonly z: number,
    ) { }

    private get data() {
        return getLocationData(this.id, this.x, this.z)
    }

    get size(): number | undefined {
        const data = this.data
        if (!data) return undefined
        return bytesToNumber(data, 0, 2)
    }
    get biomeId(): number | undefined {
        const data = this.data
        if (!data) return undefined
        return bytesToNumber(data, 2, 2)
    }
    get blocks() {
        return arrayInit(this.size!, i => new MapBlock(this.id, this.x, this.z, i))
    }
    block(index: number) {
        return new MapBlock(this.id, this.x, this.z, index)
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

export function locationOfPosition([x, z]: PlaneVector): MapLocation | undefined {
    const targetRegion = regionsOfRect(x, z, 1, 1)[0]
    if (targetRegion === undefined) return undefined
    const [rx, rz, rw, rh] = Array.from(getRegionRect(targetRegion)!)
    if (!isPointInRect([x, z], [[rx, rz], [rw, rh]])) return undefined
    return new MapLocation(targetRegion, x - rx, z - rz)
}

function renderedToImageData(rendered: Uint8Array, width: number, height: number): ImageData {
    return new ImageData(new Uint8ClampedArray(rendered), width, height)
}
function isZipFile(file: File): boolean {
    return file.type === "application/x-zip-compressed"
}

async function loadedRegionToMapRegion(id: number): Promise<MapRegion> {
    const rendered = renderLoadedRegion(id)
    const time = Number(getRegionTime(id))
    const [x, y, w, h] = Array.from(getRegionRect(id)!)
    const imageData = renderedToImageData(rendered, w, h)
    const url = await imageDataToDataUrl(imageData)
    const res = new MapRegion(
        id,
        [x, y],
        [w, h],
        new Date(time)
    )
    res.url = url
    return res
}

loadMcMapColorTable(JSON.stringify(json))

const voxelRegionZipFilesBuffer$ = voxelRegionZipFiles$
    .pipe(
        mergeMap(from),
        filter(isZipFile),
        mergeMap(loadBlobAsArrayBuffer),
    )

voxelRegionZipFilesBuffer$
    .pipe(
        map(([file, buffer]) => loadVoxelMapCacheFile(file.name, BigInt(file.lastModified), new Uint8Array(buffer))),
        mergeMap(loadedRegionToMapRegion),
        tap(console.log),
    )
    .subscribe(RenderedRegion$)
