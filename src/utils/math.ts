
export function bytesToNumber(bytes: Uint8Array, index: number, size: number): number {
    let res = 0
    for (let i = 0; i < size; i++)
        res += bytes[index + i] << 8 * i
    return res
}

export function numberToBytes(value: number, bytes: Uint8Array, index: number, size: number): void {
    for (let i = 0; i < size; i++)
        bytes[index + i] = (value >> 8 * i) & 0b1111_1111
}

export function nearestSmallerPowerOf2(n: number): number {
    return 2 << (31 - Math.clz32(n))
}

export function twoNumbersSameSign(n0: number, n1: number): boolean {
    return n0 > 0 && n1 > 0 || n0 < 0 && n1 < 0
}

export function numberBounded(lower: number, upper: number, n: number): number {
    return Math.max(lower, Math.min(upper, n))
}
