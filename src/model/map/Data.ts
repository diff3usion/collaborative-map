import _ from "lodash"
import { BlockState as UnIndexedState } from ".."
import { PlaneRect } from "../../Type"
import { bytesToNumber, numberToBytes } from "../../utils/math"
import { initArray } from "../../utils/collection"

/**
 *  Map data format with variable block numbers (small endian)
 * 
 *  RegionData      xLength * zLength * (8 + size * 5) Bytes
 *  LocationEntry       8 Bytes
 *      size        2 Bytes         // at most 65536 blocks
 *      offset      4 Bytes         // at most 4 GB size
 *      biomeId     2 Bytes         // at most 65536 biomes
 *  BlockData           5 Bytes
 *      stateKey    2 Bytes         // at most 65536 states
 *      height      2 Bytes         // at most 65536 y-position
 *      light       1 Byte
 *          blockLight  4 bits      // 0 - 15
 *          skyLight    4 bits      // 0 - 15
 *      
 *  if all region is 256 * 256 and locations has size 4
 *      data    256 * 256 * (8 + 4 * 5) = 1.75 MB
 */

const BLOCK_STATEKEY_OFFSET = 0
const BLOCK_STATEKEY_BYTES = 2
const BLOCK_HEIGHT_OFFSET = 2
const BLOCK_HEIGHT_BYTES = 2
const BLOCK_LIGHT_OFFSET = 4
const BLOCK_LIGHT_BYTES = 1
const BLOCK_DATA_BYTES = BLOCK_STATEKEY_BYTES + BLOCK_HEIGHT_BYTES + BLOCK_LIGHT_BYTES
const LOCATION_SIZE_OFFSET = 0
const LOCATION_SIZE_BYTES = 2
const LOCATION_OFFSET_OFFSET = 2
const LOCATION_OFFSET_BYTES = 4
const LOCATION_BIOMEID_OFFSET = 6
const LOCATION_BIOMEID_BYTES = 2
const LOCATION_ENTRY_BYTES = LOCATION_SIZE_BYTES + LOCATION_OFFSET_BYTES + LOCATION_BIOMEID_BYTES

type SameIdRegions = {
    count: number,
    map: Map<number, MapRegion>
}

export type UnfoldedBlock = {
    stateKey: number
    height: number
    blockLight: number
    skyLight: number
}

export type UnfoldedLocation = {
    blocks: UnfoldedBlock[]
    biomeId: number
}

export type UnIndexedRegion = {
    rect: PlaneRect
    data: Uint8Array
}

export class MapRegion {
    id: string = ""
    url: string = ""

    private static idMap: Map<string, SameIdRegions> = new Map()
    private index: () => void
        = () => {
            const regionIdBuilder: (r: MapRegion) => string
                = r => `${r.minX},${r.minZ},${r.xLength},${r.zLength}`
            const id = regionIdBuilder(this)
            const index = MapRegion.idMap.has(id) ? MapRegion.idMap.get(id)!.count : 0
            this.id = `${id}_${index}`
            if (MapRegion.idMap.has(id)) MapRegion.idMap.get(id)!.map.set(index, this)
            else MapRegion.idMap.set(id, { count: 1, map: new Map().set(index, this) })
        }
    static ofId: (id: string) => MapRegion | undefined
        = id => {
            const [prefix, suffix] = id.split('_') as [string, string]
            return MapRegion.idMap.get(prefix)?.map.get(parseInt(suffix))
        }
    static compress: (locations: UnfoldedLocation[][]) => Uint8Array
        = locations => {
            const blockDataSize =
                locations.map(row => row.map(l => l.blocks.length))
                    .reduce((rcumu, row) => row.reduce((cumu, size) => cumu + size, rcumu), 0) * BLOCK_DATA_BYTES
            let locationDataIndex = 0
            let blockDataOffset = locations.length * locations[0].length * LOCATION_ENTRY_BYTES
            const data = new Uint8Array(blockDataOffset + blockDataSize)
            locations.forEach((row, x) => row.forEach((l, z) => {
                MapLocation.compress(l, blockDataOffset, data, locationDataIndex)
                l.blocks.forEach(b => {
                    MapBlock.compress(b, data, blockDataOffset)
                    blockDataOffset += BLOCK_DATA_BYTES
                })
                locationDataIndex += LOCATION_ENTRY_BYTES
            }))
            return data
        }
    get minX(): number { return this.rect[0][0] }
    get minZ(): number { return this.rect[0][1] }
    get xLength(): number { return this.rect[1][0] }
    get zLength(): number { return this.rect[1][1] }
    location: (x: number, z: number) => MapLocation | undefined
        = (x, z) => this.locationWithOffset(x - this.minX, z - this.minZ)
    locationWithOffset: (x: number, z: number) => MapLocation | undefined
        = (x, z) => {
            if (x < 0 || x >= this.xLength || z < 0 || z >= this.zLength) return undefined
            const locationEntryIndex = LOCATION_ENTRY_BYTES * (x * this.xLength + z)
            return new MapLocation(this.data, locationEntryIndex)
        }

    constructor(
        private readonly data: Uint8Array,
        readonly rect: PlaneRect,
    ) {
        this.index()
    }
}

export class MapLocation {
    private get offset() {
        return bytesToNumber(this.data, this.index + LOCATION_OFFSET_OFFSET, LOCATION_OFFSET_BYTES)
    }
    static compress: (block: UnfoldedLocation, offset: number, data: Uint8Array, index: number) => void
        = ({ blocks: { length }, biomeId }, offset, data, index) => {
            numberToBytes(length, data, index + LOCATION_SIZE_OFFSET, LOCATION_SIZE_BYTES)
            numberToBytes(offset, data, index + LOCATION_OFFSET_OFFSET, LOCATION_OFFSET_BYTES)
            numberToBytes(biomeId, data, index + LOCATION_BIOMEID_OFFSET, LOCATION_BIOMEID_BYTES)
        }
    get size() {
        return bytesToNumber(this.data, this.index + LOCATION_SIZE_OFFSET, LOCATION_SIZE_BYTES)
    }
    get blocks(): MapBlock[] {
        const size = this.size
        const offset = this.offset
        return initArray(size, i => new MapBlock(this.data, offset + i * BLOCK_DATA_BYTES))
    }
    get biomeId(): number {
        return bytesToNumber(this.data, this.index + LOCATION_BIOMEID_OFFSET, LOCATION_BIOMEID_BYTES)
    }

    constructor(
        private readonly data: Uint8Array,
        private index: number
    ) { }
}

export interface BlockState {
    key: number
    namespace: string
    id: string
    args?: { [key: string]: string }
}

export class MapBlock {
    static savedStates: Map<string, number> = new Map()
    static stateMap: Map<number, BlockState> = new Map()
    private static keyCount: number = 0
    static indexState: (state: UnIndexedState) => BlockState
        = ({ namespace, id, args }) => {
            const res = { key: 0, namespace, id, args }
            const stringified = MapBlock.stringifyState(res)
            const saved = MapBlock.savedStates.get(stringified)
            if (saved) return MapBlock.stateMap.get(saved)!
            res.key = MapBlock.keyCount++
            MapBlock.savedStates.set(stringified, res.key)
            MapBlock.stateMap.set(res.key, res)
            return res
        }
    static stringifyState: (state: BlockState) => string
        = state => {
            const args = state.args ? Object.entries(state.args).map(([k, v]) => `${k}=${v}`).join(',') : ""
            return `${state.namespace}:${state.id}(${args})`
        }
    static compress: (block: UnfoldedBlock, data: Uint8Array, index: number) => void
        = ({ stateKey, height, blockLight, skyLight }, data, index) => {
            numberToBytes(stateKey, data, index + BLOCK_STATEKEY_OFFSET, BLOCK_STATEKEY_BYTES)
            numberToBytes(height, data, index + BLOCK_HEIGHT_OFFSET, BLOCK_HEIGHT_BYTES)
            numberToBytes(blockLight << 4 + skyLight, data, index + BLOCK_LIGHT_OFFSET, BLOCK_LIGHT_BYTES)
        }

    get key(): number {
        return bytesToNumber(this.data, this.index + BLOCK_STATEKEY_OFFSET, BLOCK_STATEKEY_BYTES)
    }
    get state(): BlockState {
        return MapBlock.stateMap.get(this.key)!
    }
    get height(): number {
        return bytesToNumber(this.data, this.index + BLOCK_HEIGHT_OFFSET, BLOCK_HEIGHT_BYTES)
    }
    get blockLight(): number {
        return bytesToNumber(this.data, this.index + BLOCK_LIGHT_OFFSET, BLOCK_LIGHT_BYTES) >> 4
    }
    get skyLight(): number {
        return bytesToNumber(this.data, this.index + BLOCK_LIGHT_OFFSET, BLOCK_LIGHT_BYTES) & 0b1111
    }

    constructor(
        private readonly data: Uint8Array,
        private index: number
    ) { }
}
