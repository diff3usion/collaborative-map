import "./"

export type RecordedMapActions<K, V> = {
    added: Map<K, V>
    removed: Map<K, V>
    updated: Map<K, V>
    untouched: Map<K, V>
}
export class RecordedMap<K, V> implements Map<K, V> {
    private _map: Map<K, V>
    private _actions?: RecordedMapActions<K, V>
    constructor(iterable?: Iterable<readonly [K, V]>) {
        this._map = iterable ? new Map(iterable) : new Map()
    }

    clear(): void {
        return this._map.clear()
    }
    delete(key: K): boolean {
        if (this._map.has(key)) {
            if (this.record.added.has(key)) {
                this.record.added.delete(key)
            } else {
                this.record.removed.set(key, this._map.get(key)!)
                this.record.updated.delete(key)
                this.record.untouched.delete(key)
            }
        }
        return this._map.delete(key)
    }
    forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
        return this._map.forEach(callbackfn, thisArg)
    }
    get(key: K): V | undefined {
        return this._map.get(key)
    }
    has(key: K): boolean {
        return this._map.has(key)
    }
    set(key: K, value: V): this {
        this.record.untouched.delete(key)
        if (this._map.has(key)) {
            const target = this.record.added.has(key) ? this.record.added : this.record.updated
            target.set(key, value)
        } else {
            if (this.record.removed.has(key)) {
                this.record.removed.delete(key)
                this.record.updated.set(key, value)
            } else {
                this.record.added.set(key, value)
            }
        }
        this._map.set(key, value)
        return this
    }
    get size(): number {
        return this._map.size
    }
    entries(): IterableIterator<[K, V]> {
        return this._map.entries()
    }
    keys(): IterableIterator<K> {
        return this._map.keys()
    }
    values(): IterableIterator<V> {
        return this._map.values()
    }
    [Symbol.iterator](): IterableIterator<[K, V]> {
        return this._map[Symbol.iterator]()
    }
    get [Symbol.toStringTag](): string {
        return this._map[Symbol.toStringTag]
    }

    get record(): RecordedMapActions<K, V> {
        if (!this._actions) {
            this._actions = {
                added: new Map(),
                removed: new Map(),
                updated: new Map(),
                untouched: new Map(this._map),
            }
        }
        return this._actions
    }
    reset(): this {
        this._actions = undefined
        return this
    }
    popRecord(): RecordedMapActions<K, V> {
        const res = this.record
        this.reset()
        return res
    }
}

export class TwoWayMap<K, V> implements Map<K, V>{
    private _map: Map<K, V>
    private _reversed: Map<V, K>
    constructor(map?: Map<K, V>) {
        this._map = new Map()
        this._reversed = new Map()
        if (map) map.forEach((v, k) => this.set(k, v))
    }

    clear(): void {
        this._map.clear()
        this._reversed.clear()
    }
    delete(key: K): boolean {
        const v = this._map.get(key)
        if (v) this._reversed.delete(v)
        return this._map.delete(key)
    }
    forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
        this._map.forEach(callbackfn, thisArg)
    }
    get(key: K): V | undefined {
        return this._map.get(key)
    }
    has(key: K): boolean {
        return this._map.has(key)
    }
    set(key: K, value: V): this {
        this._map.set(key, value)
        this._reversed.set(value, key)
        return this
    }
    get size(): number {
        return this._map.size
    }
    entries(): IterableIterator<[K, V]> {
        return this._map.entries()
    }
    keys(): IterableIterator<K> {
        return this._map.keys()
    }
    values(): IterableIterator<V> {
        return this._map.values()
    }
    [Symbol.iterator](): IterableIterator<[K, V]> {
        return this._map[Symbol.iterator]()
    }
    get [Symbol.toStringTag](): string {
        return this._map[Symbol.toStringTag]
    }

    reverseGet(k: V): K | undefined {
        return this._reversed.get(k)
    }
    reverseHas(v: V): boolean {
        return this._reversed.has(v)
    }
    reverseDelete(v: V): boolean {
        const k = this._reversed.get(v)
        if (k) this._map.delete(k)
        return this._reversed.delete(v)
    }
}

export function fillArray<T>(length: number, value: T): T[] {
    return new Array(length).fill(0).map(() => value)
}
export function initArray<T>(length: number, producer: (index: number) => T): T[] {
    return new Array(length).fill(0).map((_, index) => producer(index))
}
export function init2dArray<T>(row: number, col: number, producer: (row: number, col: number) => T): T[][] {
    return new Array(row).fill(0).map((_, r) => new Array(col).fill(0).map((_, c) => producer(r, c)))
}
export function map2dArray<T, F>(arr: T[][], producer: (val: T, row: number, col: number) => F): F[][] {
    return arr.map((row, r) => row.map((val, c) => producer(val, r, c)))
}

export function initMap<K, V>(arr: K[], mapper: (key: K) => V): Map<K, V> {
    return new Map(arr.map(k => [k, mapper(k)]))
}
export function mapMap<K, V, T, F>(map: Map<K, V>, mapper: (k: K, v: V) => [T, F]): Map<T, F> {
    const res = new Map<T, F>()
    map.forEach((v, k) => res.set(...mapper(k, v)))
    return res
}
export function mapFilter<K, V>(map: Map<K, V>, predicate: (k: K, v: V) => boolean): Map<K, V> {
    const res = new Map()
    map.forEach((v, k) => void (predicate(k, v) ? res.set(k, v) : res))
    return res
}
export function mapPartition<K, V>(map: Map<K, V>, predicate: (k: K, v: V) => boolean): [Map<K, V>, Map<K, V>] {
    const res = [new Map(), new Map()] as [Map<K, V>, Map<K, V>]
    map.forEach((v, k) => res[predicate(k, v) ? 0 : 1].set(k, v))
    return res
}
export function mapMapKey<K, V, T>(map: Map<K, V>, mapper: (k: K, v: V) => T): Map<T, V> {
    return mapMap(map, (k, v) => [mapper(k, v), v])
}
export function mapMapValue<K, V, T>(map: Map<K, V>, mapper: (v: V, k: K) => T): Map<K, T> {
    return mapMap(map, (k, v) => [k, mapper(v, k)])
}

export function mapGetOrInit<K, V>(map: Map<K, V>, key: K, val: V): V {
    return map.has(key) ? map.get(key)! : map.set(key, val).get(key)!
}
export function mapPushOrInit<T, F>(map: Map<T, F[]>, key: T, value: F): void {
    map.has(key) ? map.get(key)!.push(value) : map.set(key, [value])
}
export function mapAddOrInit<T, F>(map: Map<T, Set<F>>, key: T, value: F): void {
    map.has(key) ? map.get(key)!.add(value) : map.set(key, new Set([value]))
}

export function arraySomeIn<T>(arr: T[], set: { has(key: T): boolean }): boolean {
    return arr.some(c => set.has(c))
}
export function arraySomeNotIn<T>(arr: T[], set: { has(key: T): boolean }): boolean {
    return arr.some(c => !set.has(c))
}
export function arrayEveryIn<T>(arr: T[], set: { has(key: T): boolean }): boolean {
    return arr.every(c => set.has(c))
}
export function arrayEveryNotIn<T>(arr: T[], set: { has(key: T): boolean }): boolean {
    return arr.every(c => !set.has(c))
}
export function arrayFilterIn<T>(arr: T[], set: { has(key: T): boolean }): T[] {
    return arr.filter(c => set.has(c))
}
export function arrayFilterNotIn<T>(arr: T[], set: { has(key: T): boolean }): T[] {
    return arr.filter(c => !set.has(c))
}

export function setAdd<T>(set0: Set<T>, collection: Array<T> | Set<T>): Set<T> {
    collection.forEach((v: T) => set0.add(v))
    return set0
}
export function setRemove<T>(set0: Set<T>, collection: Array<T> | Set<T>): Set<T> {
    collection.forEach((v: T) => set0.delete(v))
    return set0
}

function twoSetUnion<T>(a: Set<T>, b: Set<T>): Set<T> {
    const res = new Set<T>()
    a.forEach(v => res.add(v))
    b.forEach(v => res.add(v))
    return res
}
export function setUnion<T>(set0: Set<T>, set1: Set<T>, ...sets: Set<T>[]): Set<T> {
    return sets.reduce((res, set) => twoSetUnion(res, set), twoSetUnion(set0, set1))
}
function twoSetIntersect<T>(a: Set<T>, b: Set<T>): Set<T> {
    const res = new Set<T>()
    a.forEach(v => { if (b.has(v)) res.add(v) })
    return res
}
export function setIntersect<T>(set0: Set<T>, set1: Set<T>, ...sets: Set<T>[]): Set<T> {
    return sets.reduce((res, set) => twoSetIntersect(res, set), twoSetIntersect(set0, set1))
}
function twoSetSubtract<T>(a: Set<T>, b: Set<T>): Set<T> {
    const res = new Set<T>()
    a.forEach(v => { if (!b.has(v)) res.add(v) })
    return res
}
export function setSubtract<T>(set0: Set<T>, set1: Set<T>, ...sets: Set<T>[]): Set<T> {
    return sets.reduce((res, set) => twoSetSubtract(res, set), twoSetSubtract(set0, set1))
}
export function twoSetEqual<T>(a: Set<T>, b: Set<T>): boolean {
    if (a.size !== b.size) return false
    a.forEach(v => { if (!b.has(v)) return false })
    return true
}
