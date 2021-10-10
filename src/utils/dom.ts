export function initTempCanvas(width: number, height: number): HTMLCanvasElement {
    const res = document.createElement('canvas')
    res.width = width
    res.height = height
    return res
}

export async function imageDataToBase64Url(imgData: ImageData): Promise<string> {
    const tempCanvas = initTempCanvas(imgData.width, imgData.height)
    tempCanvas.getContext("2d")!.putImageData(imgData, 0, 0)
    const blob = await new Promise<Blob>((resolve, reject) =>
        tempCanvas.toBlob(b => b ? resolve(b) : reject(b)))
    const reader = new FileReader()
    reader.readAsDataURL(blob)
    return new Promise<string>((resolve, reject) => {
        reader.onload = _ =>
            reader.result ? resolve(reader.result! as string) : reject()
        reader.onerror = reject
    })
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
