export function initTempCanvas(width: number, height: number): HTMLCanvasElement {
    const res = document.createElement('canvas')
    res.width = width
    res.height = height
    return res
}
export async function loadBlobAsArrayBuffer<T extends Blob>(blob: T): Promise<[T, ArrayBuffer]> {
    const fileReader = new FileReader()
    const res = new Promise<[T, ArrayBuffer]>((resolve, reject) => {
        fileReader.onload = e => resolve([blob, e.target!.result as ArrayBuffer])
        fileReader.onerror = reject
    })
    fileReader.readAsArrayBuffer(blob)
    return res
}
export async function loadBlobAsDataUrl<T extends Blob>(blob: T): Promise<[T, string]> {
    const fileReader = new FileReader()
    const res = new Promise<[T, string]>((resolve, reject) => {
        fileReader.onload = e => resolve([blob, e.target!.result as string])
        fileReader.onerror = reject
    })
    fileReader.readAsDataURL(blob)
    return res
}
export async function imageDataToDataUrl(imgData: ImageData): Promise<string> {
    const tempCanvas = initTempCanvas(imgData.width, imgData.height)
    tempCanvas.getContext("2d")!.putImageData(imgData, 0, 0)
    const blob = await new Promise<Blob>((resolve, reject) =>
        tempCanvas.toBlob(b => b ? resolve(b) : reject(b)))
    const [_, res] = await loadBlobAsDataUrl(blob)
    return res
}
export function imageElementToImageData(img: HTMLImageElement): ImageData {
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = img.width
    tempCanvas.height = img.height
    const context = tempCanvas.getContext('2d')!
    context.drawImage(img, 0, 0)
    tempCanvas.remove()
    return context.getImageData(0, 0, img.width, img.height)
}
export function urlToImageElement(url: string, width: number, height: number): HTMLImageElement {
    const res = document.createElement('img')
    res.src = url
    res.width = width
    res.height = height
    return res
}
