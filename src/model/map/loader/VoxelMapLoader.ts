import * as zip from "@zip.js/zip.js"
import { of, from, forkJoin, map, mergeMap, Observable, filter } from "rxjs"

import { initArray } from "../../../utils"
import { BlockState } from "../../../Type"
import { UnIndexedRegion, MapRegion, MapBlock, UnfoldedLocation, UnfoldedBlock } from "../Data"
import { VoxelRegionZipFiles$ } from "../../../App"
import { regionProvider$ } from ".."

type VoxelLayer = {
    state: BlockState
    height: number
    skyLight: number
    blockLight: number
}

type VoxelColumn = {
    surface: VoxelLayer
    oceanfloor: VoxelLayer
    transparent: VoxelLayer
    foliage: VoxelLayer
    biomeId: number
}

type VoxelRegionIndex = [number, number]
type CacheData = Uint8Array
type CacheKey = Map<number, BlockState>
type CacheControl = Map<string, string>
type VoxelMapCache = {
    index: VoxelRegionIndex
    control: string
    key: string
    data: Uint8Array
}

type VoxelRegion = {
    index: VoxelRegionIndex
    columns: VoxelColumn[][]
}

const VOXEL_MAP_COLOMN_BYTES = 18
const VOXEL_MAP_REGION_WIDTH = 256
const VOXEL_MAP_REGION_HEIGHT = 256

const layerToMapBlock: (layer: VoxelLayer) => UnfoldedBlock
    = ({ state, height, blockLight, skyLight }) =>
        ({ stateKey: MapBlock.indexState(state).key, height, blockLight, skyLight })

const columnToMapLocation: (column: VoxelColumn) => UnfoldedLocation
    = column => {
        const blocks = [column.surface, column.oceanfloor, column.transparent, column.foliage]
            .map(layerToMapBlock)
            .filter(b => b.height)
            .sort((a, b) => a.height - b.height)
        const biomeId = column.biomeId
        return { blocks, biomeId }
    }

const regionToMapRegion: (region: VoxelRegion) => UnIndexedRegion
    = region => {
        const [xLength, zLength] = [VOXEL_MAP_REGION_WIDTH, VOXEL_MAP_REGION_HEIGHT]
        const [minX, minZ] = [region.index[0] * xLength, region.index[1] * zLength]
        const data = MapRegion.compress(region.columns.map(zColumns => zColumns.map(columnToMapLocation)))
        return { rect: [[minX, minZ], [xLength, zLength]], data }
    }

const cacheToMapRegion: (indexedCache: VoxelMapCache) => UnIndexedRegion
    = indexedCache => {
        let data: (x: number, z: number, byte: number) => number = () => 0
        const cache = indexedCache
        const parseControl: (control: string) => CacheControl = control => {
            const res = new Map(control.split("\r\n").map(line => line.split(':') as [string, string]))
            if (!res.has("version"))
                throw new Error("Error when decoding region control: Missing version")
            return res
        }

        const keyLineRegex = /(\d+)\sBlock\{(\w+)\:(\w+)\}(?:\[(.+)\])*/
        const parseKey: (key: string) => CacheKey = key =>
            new Map(key.split("\r\n")
                .filter(line => line.trim().length)
                .map(line => {
                    const capture = keyLineRegex.exec(line)
                    if (!capture || (capture.length !== 4 && capture.length !== 5))
                        throw new Error("Error when decoding region key: Unmatched line " + line)
                    const stateId = parseInt(capture[1])
                    const namespace = capture[2]
                    const id = capture[3] === "grass_path" ? "dirt_path" : capture[3]
                    // FIX: grass_path => dirt_path
                    const args = {} as { [key: string]: string }
                    capture[4] ? capture[4].split(',')
                        .map(arg => arg.split('=') as [string, string])
                        .forEach(argPair => args[argPair[0]] = argPair[1]) : undefined
                    return [stateId, { namespace, id, args }]
                }))

        const decodeBlockData: (key: CacheKey, x: number, z: number, offset: number) => UnfoldedBlock
            = (key, x, z, offset) => {
                const state = key.get((data(x, z, offset + 1) << 8) + data(x, z, offset + 2))!
                const height = data(x, z, offset)
                const light = data(x, z, offset + 3)
                const skyLight = Math.floor(light >> 4)
                const blockLight = light % 16
                return ({ stateKey: MapBlock.indexState(state).key, height, blockLight, skyLight })
            }

        const decodeColumnData: (key: CacheKey, x: number, z: number) => UnfoldedLocation
            = (key, x, z) => {
                const blocks = [
                    decodeBlockData(key, x, z, 0),
                    decodeBlockData(key, x, z, 4),
                    decodeBlockData(key, x, z, 8),
                    decodeBlockData(key, x, z, 12),
                ]
                const biomeId = (data(x, z, 16) << 8) + data(x, z, 17)
                return { blocks, biomeId }
            }

        const decodeData: (control: CacheControl, key: CacheKey, cacheData: CacheData) => UnIndexedRegion
            = (control, key, cacheData) => {
                if (cacheData.length != VOXEL_MAP_REGION_WIDTH * VOXEL_MAP_REGION_HEIGHT * VOXEL_MAP_COLOMN_BYTES)
                    throw new Error("Error when decoding region data: Unmatched size")
                const version = parseInt(control.get("version")!)
                let dataIndexOf: (x: number, z: number, byte: number) => number
                if (version === 1) {
                    dataIndexOf = (x, z, byte) => byte + x * VOXEL_MAP_COLOMN_BYTES + z * VOXEL_MAP_COLOMN_BYTES * VOXEL_MAP_REGION_WIDTH
                } else if (version === 2) {
                    dataIndexOf = (x, z, byte) => x + z * VOXEL_MAP_REGION_WIDTH + byte * VOXEL_MAP_REGION_WIDTH * VOXEL_MAP_REGION_HEIGHT
                } else {
                    throw new Error("Error when decoding region data: Unknown version")
                }
                data = (x: number, z: number, byte: number) => cacheData[dataIndexOf(x, z, byte)]
                const columns = initArray(VOXEL_MAP_REGION_WIDTH, () => new Array(VOXEL_MAP_REGION_HEIGHT))
                for (let x = 0; x < VOXEL_MAP_REGION_WIDTH; x++)
                    for (let z = 0; z < VOXEL_MAP_REGION_HEIGHT; z++)
                        columns[x][z] = decodeColumnData(key, x, z)
                const [xLength, zLength] = [VOXEL_MAP_REGION_WIDTH, VOXEL_MAP_REGION_HEIGHT]
                const [minX, minZ] = [cache.index[0] * xLength, cache.index[1] * zLength]
                const region = MapRegion.compress(columns)
                return { rect: [[minX, minZ], [xLength, zLength]], data: region }
            }

        const control = parseControl(cache.control)
        const key = parseKey(cache.key)
        return decodeData(control, key, cache.data)
    }

const cacheToRegion: (indexedCache: VoxelMapCache) => VoxelRegion
    = indexedCache => {
        const cache = indexedCache
        const parseControl: (control: string) => CacheControl = control => {
            const res = new Map(control.split("\r\n").map(line => line.split(':') as [string, string]))
            if (!res.has("version"))
                throw new Error("Error when decoding region control: Missing version")
            return res
        }

        const keyLineRegex = /(\d+)\sBlock\{(\w+)\:(\w+)\}(?:\[(.+)\])*/
        const parseKey: (key: string) => CacheKey = key =>
            new Map(key.split("\r\n")
                .filter(line => line.trim().length)
                .map(line => {
                    const capture = keyLineRegex.exec(line)
                    if (!capture || (capture.length !== 4 && capture.length !== 5))
                        throw new Error("Error when decoding region key: Unmatched line " + line)
                    const stateId = parseInt(capture[1])
                    const namespace = capture[2]
                    const id = capture[3] === "grass_path" ? "dirt_path" : capture[3]
                    // FIX: grass_path => dirt_path
                    const args = {} as { [key: string]: string }
                    capture[4] ? capture[4].split(',')
                        .map(arg => arg.split('=') as [string, string])
                        .forEach(argPair => args[argPair[0]] = argPair[1]) : undefined
                    return [stateId, { namespace, id, args }]
                }))

        const decodeLayerData: (key: CacheKey, data: Uint8Array) => VoxelLayer = (key, data) => ({
            state: key.get((data[1] << 8) + data[2])!,
            height: data[0],
            skyLight: Math.floor(data[3] >> 4),
            blockLight: data[3] % 16
        })

        const decodeColumnData: (key: CacheKey, data: Uint8Array) => VoxelColumn = (key, data) => ({
            surface: decodeLayerData(key, data.subarray(0, 4)),
            oceanfloor: decodeLayerData(key, data.subarray(4, 8)),
            transparent: decodeLayerData(key, data.subarray(8, 12)),
            foliage: decodeLayerData(key, data.subarray(12, 16)),
            biomeId: (data[16] << 8) + data[17]
        })

        const decodeMapData: (key: CacheKey, data: Uint8Array[][]) => VoxelColumn[][] = (key, data) => {
            const columns = initArray(VOXEL_MAP_REGION_WIDTH, () => new Array(VOXEL_MAP_REGION_HEIGHT))
            for (let x = 0; x < VOXEL_MAP_REGION_WIDTH; x++)
                for (let z = 0; z < VOXEL_MAP_REGION_HEIGHT; z++)
                    columns[x][z] = decodeColumnData(key, data[x][z])
            return columns
        }

        const decodeData: (control: CacheControl, key: CacheKey, data: CacheData) => VoxelRegion = (control, key, data) => {
            if (data.length != VOXEL_MAP_REGION_WIDTH * VOXEL_MAP_REGION_HEIGHT * VOXEL_MAP_COLOMN_BYTES)
                throw new Error("Error when decoding region data: Unmatched size")
            const version = parseInt(control.get("version")!)
            const mapData: Uint8Array[][] =
                initArray(VOXEL_MAP_REGION_WIDTH, () => initArray(VOXEL_MAP_REGION_HEIGHT, () => new Uint8Array(VOXEL_MAP_COLOMN_BYTES)))
            let dataIndexOf: (x: number, z: number, byte: number) => number
            if (version === 1) {
                dataIndexOf = (x, z, byte) => byte + x * VOXEL_MAP_COLOMN_BYTES + z * VOXEL_MAP_COLOMN_BYTES * VOXEL_MAP_REGION_WIDTH
            } else if (version === 2) {
                dataIndexOf = (x, z, byte) => x + z * VOXEL_MAP_REGION_WIDTH + byte * VOXEL_MAP_REGION_WIDTH * VOXEL_MAP_REGION_HEIGHT
            } else {
                throw new Error("Error when decoding region data: Unknown version")
            }
            for (let x = 0; x < VOXEL_MAP_REGION_WIDTH; x++)
                for (let z = 0; z < VOXEL_MAP_REGION_HEIGHT; z++)
                    for (let byte = 0; byte < VOXEL_MAP_COLOMN_BYTES; byte++)
                        mapData[x][z][byte] = data[dataIndexOf(x, z, byte)]
            const columns = decodeMapData(key, mapData)
            return { index: cache.index, columns }
        }

        const control = parseControl(cache.control)
        const key = parseKey(cache.key)
        return decodeData(control, key, cache.data)
    }

const regionZipBlobToCache: (indexedBlob: IndexedRegionZipBlob) => Promise<VoxelMapCache>
    = async indexedBlob => {
        const [blob, index] = indexedBlob
        const zipReader = new zip.ZipReader(new zip.BlobReader(blob))
        const entries = await zipReader.getEntries()
        if (entries.length !== 3)
            throw new Error("Error when reading region zip: unmatched entries")

        const [controlEntry, dataEntry, keyEntry] = entries.sort((a, b) => a.filename.localeCompare(b.filename))
        const control = await controlEntry.getData!(new zip.TextWriter())
        const key = await keyEntry.getData!(new zip.TextWriter())
        const data = await dataEntry.getData!(new zip.Uint8ArrayWriter())
        await zipReader.close()

        return { index, control, key, data }
    }
type IndexedRegionZipBlob = [Blob, VoxelRegionIndex]
type IndexedRegionZipFileLoadedEvent = [ProgressEvent<FileReader>, VoxelRegionIndex]
const regionZipFileLoadedEventToBlob: (indexedEvent: IndexedRegionZipFileLoadedEvent) => IndexedRegionZipBlob
    = indexedEvent => {
        const [event, index] = indexedEvent
        if (!event.target || !event.target.result)
            throw new Error("Error when loading region zip file: Loading failed")
        return [new Blob([event.target.result]), index]
    }

const loadRegionZipFile: (file: File) => Observable<ProgressEvent<FileReader>>
    = file => from(new Promise<ProgressEvent<FileReader>>((resolve, reject) => {
        const fileReader = new FileReader()
        fileReader.onload = resolve
        fileReader.onerror = reject
        fileReader.readAsArrayBuffer(file)
    }))

const parseRegionZipFileName: (file: File) => VoxelRegionIndex
    = file => {
        const parsedName = file.name.substring(0, file.name.length - 4).split(',') as unknown as VoxelRegionIndex
        if (parsedName.length !== 2)
            throw new Error("Error when loading region zip file: Invalid name")
        return parsedName
    }

const isZipFile: (file: File) => boolean
    = file => file.name.split('.').pop() === "zip"

const VoxelMapRegion$ = VoxelRegionZipFiles$
    .pipe(
        mergeMap(fileList =>
            from(fileList).pipe(
                filter(isZipFile),
                mergeMap(zipFile =>
                    forkJoin([
                        loadRegionZipFile(zipFile),
                        of(parseRegionZipFileName(zipFile))
                    ])
                )
            )
        ),
        map(regionZipFileLoadedEventToBlob),
        mergeMap(blob =>
            from(regionZipBlobToCache(blob))
        ),
        // map(cacheToMapRegion),
        map(cacheToRegion),
        map(regionToMapRegion),
    )

regionProvider$.next(VoxelMapRegion$)
