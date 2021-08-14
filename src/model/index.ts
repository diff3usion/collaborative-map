import { PlaneRect, PlaneVector } from "../Type";
import { bytesToNumber, stringToArray } from "../utils";
import { getBlockMeta, getLocationMeta, getBlockState } from "./build";

export interface BlockState {
    namespace: string
    id: string
    args?: { [key: string]: string }
}

const blockStateStringFormat = /(\w+)\:(\w+)(?:\[(.+)\])*/
const parseBlockState: (stringified: string) => BlockState | undefined
    = s => {
        const capture = blockStateStringFormat.exec(s)
        if (!capture || (capture.length !== 4 && capture.length !== 5))
            return undefined
        const namespace = capture[1]
        const id = capture[2]
        const args = {} as { [key: string]: string }
        capture[3] ? capture[3].split(',')
            .map(arg => arg.split('=') as [string, string])
            .forEach(argPair => args[argPair[0]] = argPair[1]) : undefined
        return { namespace, id, args }
    }

export class MapBlock {
    constructor(
        private id: number,
        private x: number,
        private z: number,
        private i: number,
    ) { }

    private decode() {
        const encoded = getBlockMeta(this.id, this.x, this.z, this.i)
        return encoded ? stringToArray(encoded) : undefined
    }

    get state(): BlockState | undefined {
        const decoded = this.decode()
        if (!decoded) return undefined
        const key = bytesToNumber(decoded, 0, 2)
        const stringified = getBlockState(key)
        if (!stringified) return undefined
        return parseBlockState(stringified)
    }
    get height(): number | undefined {
        const decoded = this.decode()
        if (!decoded) return undefined
        return bytesToNumber(decoded, 2, 2)
    }
    get blockLight(): number | undefined {
        const decoded = this.decode()
        if (!decoded) return undefined
        return bytesToNumber(decoded, 4, 2) >> 4
    }
    get skyLight(): number | undefined {
        const decoded = this.decode()
        if (!decoded) return undefined
        return bytesToNumber(decoded, 4, 2) && 0b1111
    }
}

export class MapLocation {
    constructor(
        private id: number,
        private x: number,
        private z: number,
    ) { }

    private decode() {
        const encoded = getLocationMeta(this.id, this.x, this.z)
        return encoded ? stringToArray(encoded) : undefined
    }

    get size(): number | undefined {
        const decoded = this.decode()
        if (!decoded) return undefined
        return bytesToNumber(decoded, 0, 16)
    }

    get biomeId(): number | undefined {
        const decoded = this.decode()
        if (!decoded) return undefined
        return bytesToNumber(decoded, 2, 16)
    }

    block(index: number) {
        return new MapBlock(this.id, this.x, this.z, index)
    }
}

export class MapRegion {
    constructor(
        private id: number,
        private position: PlaneVector,
        private size: PlaneRect,
        private date: number,
    ) { }

    location(x: number, z: number) {
        return new MapLocation(this.id, x, z)
    }
}
