import * as zip from "@zip.js/zip.js"
import { concatMap, firstValueFrom, from, toArray } from "rxjs"
import { BlockState } from "../../Type"

type BlockTextureMetaAnimation = {
    interpolate?: boolean
    frametime?: number
    frames: number[]
}

type BlockTextureMeta = {
    animation?: BlockTextureMetaAnimation
}

type BlockTextureFace = {
    static: ImageData
    dynamic?: ImageData[]
    meta?: BlockTextureMeta
}

enum BlockTextureSide {
    TOP = "top",
    BOTTOM = "bottom",
    FRONT = "front",
    BACK = "back",
    SIDE = "side",
    SIDE1 = "side1",
    SIDE2 = "side2",
    SIDE3 = "side3",
    SIDE4 = "side4",
}

type BlockTexture = {
    main: BlockTextureFace
    [side: string]: BlockTextureFace
}

interface Texture {
    blockStateToTexture: (state: BlockState, side: string) => BlockTextureFace
}

const imgElementToImageData = (img: HTMLImageElement) => {
    const tempCanvas = document.createElement('canvas')
    console.log(img.width)
    tempCanvas.width = img.width
    tempCanvas.height = img.height
    const context = tempCanvas.getContext('2d')!
    context.drawImage(img, 0, 0)
    return context.getImageData(0, 0, img.width, img.height)
}

const pngToImgElement = (png: Blob) => {
    const res = document.createElement('img')
    res.src = URL.createObjectURL(png)
    res.width = 16
    res.height = 16
    document.body.appendChild(res)
    return res
}

const textureZipToMapTexture = async (regionZip: Blob) => {
    const zipReader = new zip.ZipReader(
        new zip.BlobReader(regionZip),
        { filenameEncoding: "gbk" }
    )

    const entries = await zipReader.getEntries()
    const pngEntries = entries.filter(e => e.filename.split('.').pop() === "png")
    const names = pngEntries.map(e => e.filename.substring(0, e.filename.length - 4))
    const pngBlobs = await firstValueFrom(from(pngEntries).pipe(
        concatMap(e => e.getData!(new zip.BlobWriter("image/png"))),
        toArray()
    ))
    console.log(pngBlobs)
    const imageDatas = pngBlobs.map(pngToImgElement).map(imgElementToImageData)
    const textureMap = new Map(names.map((n, i) => [n, imageDatas[i]]))
    return { textureMap }
}

const onTextureFileLoad = async (event: ProgressEvent<FileReader>) => {
    if (!event.target || !event.target.result)
        throw new Error("TODO")
    const buffer = event.target.result
    const textureZip = new Blob([buffer])
    const texture = await textureZipToMapTexture(textureZip)
    console.log(texture)
}

const openTextureFile: (file: File) => void = file => {
    const fileReader = new FileReader()
    fileReader.onload = onTextureFileLoad
    fileReader.readAsArrayBuffer(file)
}
