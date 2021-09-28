import "./"

export type MapDiff<K, V> = {
    addition: Map<K, V>
    deletion: Map<K, V>
    update: Map<K, [V, V]>
}
export type SetDiff<T> = {
    addition: Set<T>
    deletion: Set<T>
}
export type Diff<T extends Map<any, any> | Set<any>>
    = T extends Map<infer K, infer V> ? MapDiff<K, V>
    : T extends Set<infer T> ? SetDiff<T>
    : never
export class DiffRecordedMap<K, V> extends Map<K, V> {
    private _actions?: MapDiff<K, V>

    clear(): void {
        this.forEach((v, k) => { if (!this.record.addition.has(k)) this.record.deletion.set(k, v) })
        this.record.update.forEach(([v], k) => this.record.deletion.set(k, v))
        this.record.addition.clear()
        this.record.update.clear()
        return super.clear()
    }
    delete(key: K): boolean {
        if (this.has(key)) {
            if (this.record.addition.has(key)) {
                this.record.addition.delete(key)
            } else {
                const updated = this.record.update.get(key)
                if (updated) {
                    this.record.deletion.set(key, updated[0])
                } else {
                    this.record.deletion.set(key, this.get(key)!)
                }
            }
        }
        return super.delete(key)
    }
    set(key: K, value: V): this {
        if (this.has(key)) {
            if (this.record.addition.has(key)) {
                this.record.addition.set(key, value)
            } else {
                const updated = this.record.update.get(key)
                if (updated) {
                    this.record.update.set(key, [updated[0], value])
                } else {
                    this.record.update.set(key, [this.get(key)!, value])
                }
            }
        } else {
            const removed = this.record.deletion.get(key)
            if (removed) {
                if (removed !== value)
                    this.record.update.set(key, [this.record.deletion.get(key)!, value])
                this.record.deletion.delete(key)
            } else {
                this.record.addition.set(key, value)
            }
        }
        return super.set(key, value)
    }

    get record(): MapDiff<K, V> {
        if (!this._actions) {
            this._actions = {
                addition: new Map(),
                deletion: new Map(),
                update: new Map(),
            }
        }
        return this._actions
    }
    pop(): MapDiff<K, V> {
        const res = this.record
        this._actions = undefined
        return res
    }
}
export class DiffRecordedSet<T> extends Set<T> {
    private _actions?: SetDiff<T>

    add(value: T): this {
        if (!this.has(value)) {
            this.record.addition.add(value)
        }
        return super.add(value)
    }
    clear(): void {
        setAdd(this.record.deletion, setSubtract(this, this.record.addition))
        return super.clear()
    }
    delete(value: T): boolean {
        if (this.has(value)) {
            if (this.record.addition.has(value)) {
                this.record.addition.delete(value)
            } else {
                this.record.deletion.add(value)
            }
        }
        return super.delete(value)
    }

    get record(): SetDiff<T> {
        if (!this._actions) {
            this._actions = {
                addition: new Set(),
                deletion: new Set(),
            }
        }
        return this._actions
    }
}

export function twoMapsDiff<K, V>(
    map0: Map<K, V>,
    map1: Map<K, V>,
    comparator: (prev: V, curr: V) => boolean = (prev, curr) => prev === curr
): MapDiff<K, V> {
    const addition = new Map<K, V>()
    const deletion = new Map<K, V>()
    const update = new Map<K, [V, V]>()
    map1.forEach((curr, k) => {
        const prev = map0.get(k)
        if (prev === undefined) {
            addition.set(k, curr)
        } else if (!comparator(prev, curr)) {
            update.set(k, [prev, curr])
        }
    })
    map0.forEach((v, k) => {
        if (!map1.has(k)) {
            deletion.set(k, v)
        }
    })
    return { addition, deletion, update }
}

export function twoSetsDiff<T>(
    set0: Set<T>,
    set1: Set<T>
): SetDiff<T> {
    const addition = twoSetSubtract(set1, set0)
    const deletion = twoSetSubtract(set0, set1)
    return { addition, deletion }
}

export class TwoWayMap<K, V> extends Map<K, V> {
    private _reversed: Map<V, K> = new Map()

    private constructor() {
        super()
    }
    static from<K, V>(iterable?: Iterable<readonly [K, V]>): TwoWayMap<K, V> {
        const res = new TwoWayMap<K, V>()
        if (iterable) for (let [k, v] of iterable) res.set(k, v)
        return res
    }

    clear(): void {
        super.clear()
        this._reversed.clear()
    }
    delete(key: K): boolean {
        const value = this.get(key)
        if (value) this._reversed.delete(value)
        return super.delete(key)
    }
    set(key: K, value: V): this {
        super.set(key, value)
        this._reversed.set(value, key)
        return this
    }

    get reversed(): Map<V, K> {
        return new Map(this._reversed)
    }
    reverseGet(value: V): K | undefined {
        return this._reversed.get(value)
    }
    reverseHas(value: V): boolean {
        return this._reversed.has(value)
    }
    reverseDelete(value: V): boolean {
        const key = this._reversed.get(value)
        if (key) super.delete(key)
        return this._reversed.delete(value)
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
export function arrayMapPushOrInit<T, F>(map: Map<T, F[]>, key: T, value: F): void {
    map.has(key) ? map.get(key)!.push(value) : map.set(key, [value])
}
export function setMapAddOrInit<T, F>(map: Map<T, Set<F>>, key: T, value: F): void {
    map.has(key) ? map.get(key)!.add(value) : map.set(key, new Set([value]))
}

interface PredicateCollection<T> { has(key: T): boolean }
export function arraySomeIn<T>(arr: T[], collection: PredicateCollection<T>): boolean {
    return arr.some(c => collection.has(c))
}
export function arraySomeNotIn<T>(arr: T[], collection: PredicateCollection<T>): boolean {
    return arr.some(c => !collection.has(c))
}
export function arrayEveryIn<T>(arr: T[], collection: PredicateCollection<T>): boolean {
    return arr.every(c => collection.has(c))
}
export function arrayEveryNotIn<T>(arr: T[], collection: PredicateCollection<T>): boolean {
    return arr.every(c => !collection.has(c))
}
export function arrayFilterIn<T>(arr: T[], collection: PredicateCollection<T>): T[] {
    return arr.filter(c => collection.has(c))
}
export function arrayFilterNotIn<T>(arr: T[], collection: PredicateCollection<T>): T[] {
    return arr.filter(c => !collection.has(c))
}

export function setAdd<T>(set: Set<T>, iterable: Iterable<T>): Set<T> {
    for (let v of iterable) set.add(v)
    return set
}
export function setRemove<T>(set: Set<T>, iterable: Iterable<T>): Set<T> {
    for (let v of iterable) set.delete(v)
    return set
}
export function mapAdd<K, V>(map: Map<K, V>, iterable: Iterable<readonly [K, V]>): Map<K, V> {
    for (let [k, v] of iterable) map.set(k, v)
    return map
}
export function mapDelete<K, V>(map: Map<K, V>, iterable: Iterable<K>): Map<K, V> {
    for (let k of iterable) map.delete(k)
    return map
}
export function mapRemove<K, V>(map: Map<K, V>, iterable: Iterable<readonly [K, V]>): Map<K, V> {
    for (let [k, v] of iterable) if (map.get(k) === v) map.delete(k)
    return map
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
