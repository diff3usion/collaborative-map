export const initTempCanvas: (width: number, height: number) => HTMLCanvasElement
    = (width, height) => {
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = width
        tempCanvas.height = height
        return tempCanvas
    }

export const imageDataToBase64Url: (imgData: ImageData) => Promise<string>
    = async imgData => {
        const tempCanvas = initTempCanvas(imgData.width, imgData.height)
        tempCanvas.getContext("2d")!.putImageData(imgData, 0, 0)
        const reader = new FileReader()
        const blob = await new Promise<Blob>((resolve, reject) =>
            tempCanvas.toBlob(b => b ? resolve(b) : reject(b)))
        reader.readAsDataURL(blob)
        return new Promise<string>((resolve, reject) => {
            reader.onload = _ =>
                reader.result ? resolve(reader.result! as string) : reject()
            reader.onerror = reject
        })
    }

export const imgElementToImageData: (img: HTMLImageElement) => ImageData
    = img => {
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = img.width
        tempCanvas.height = img.height
        const context = tempCanvas.getContext('2d')!
        context.drawImage(img, 0, 0)
        tempCanvas.remove()
        return context.getImageData(0, 0, img.width, img.height)
    }

export const imageUrlToImgElement: (url: string, width: number, height: number) => HTMLImageElement
    = (url, width, height) => {
        const imgElement = document.createElement('img')
        imgElement.src = url
        imgElement.width = width
        imgElement.height = height
        return imgElement
    }
    