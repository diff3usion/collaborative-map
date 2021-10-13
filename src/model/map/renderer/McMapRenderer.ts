import _ from "lodash"
import { Loader, Sprite, SCALE_MODES } from "pixi.js"
import { filter, bufferTime, mergeMap, concatMap, tap } from "rxjs"

import { mapContainer } from "../../../view/MapContainer/Map"
import { BlockState, MapRegion } from "../Data"
import json from './map_color_table.json'
import { newRegion$ } from ".."
import { RenderedRegion$ } from "../../../store/MapData"
import { imageDataToDataUrl, initTempCanvas } from "../../../utils/dom"
import { init2dArray, initArray } from "../../../utils/collection"


type Color = [number, number, number, number]
const colorValues = Array(...json.table).map(arr => arr[1] as Color)
const colorMapping = Array(...json.table).map(arr => new Set(arr[2] as string[]))

const colorMatrixToImageData: (matrix: Color[][]) => ImageData
    = matrix => {
        const [width, height] = [matrix.length, matrix[0].length]
        const getImgDataIndex: (i: number, j: number, c: number) => number
            = (i, j, c) => j * width * 4 + i * 4 + c
        const tempCanvas = initTempCanvas(width, height)
        const context = tempCanvas.getContext('2d')!
        const imgData = context.getImageData(0, 0, width, height)
        matrix.forEach((row, i) =>
            row.forEach((colors, j) =>
                colors.forEach((v, c) =>
                    imgData.data[getImgDataIndex(i, j, c)] = v)))
        return imgData
    }

const LIGHTER_MULTIPLIER = 1
const NORMAL_MULTIPLIER = 0.86
const DARKER_MULTIPLIER = 0.71
const renderRegion: (region: MapRegion) => Promise<MapRegion>
    = async region => {
        const stateToColor: (state: BlockState,) => Color
            = state => {
                const colorIndex = colorMapping.findIndex(m => m.has(state.id))
                if (colorIndex === -1) {
                    console.error(`Unknown color index for: ${state}`)
                    return [0, 0, 0, 0]
                }
                return colorValues[colorIndex]
            }

        const colorMatrix = init2dArray(region.xLength, region.zLength, () => initArray(4, () => 0) as Color)
        for (let x = 0; x < region.xLength; x++)
            for (let z = 0; z < region.zLength; z++) {
                const location = region.locationWithOffset(x, z)
                const thisBlock = _.findLast(location?.blocks, b => stateToColor(b.state)[3] !== 0)
                if (thisBlock) {
                    let multiplier = NORMAL_MULTIPLIER
                    const northLocation = region.locationWithOffset(x, z - 1)
                    const northBlock = _.findLast(northLocation?.blocks, b => stateToColor(b.state)[3] != 0)!
                    if (northBlock) {
                        if (northBlock.height !== thisBlock.height) {
                            multiplier = thisBlock.height > northBlock.height ? LIGHTER_MULTIPLIER : DARKER_MULTIPLIER
                        }
                    }
                    colorMatrix[x][z] = stateToColor(thisBlock.state).map((v, i) => i === 3 ? v : Math.floor(v * multiplier)) as Color
                }
            }

        const imageData = colorMatrixToImageData(colorMatrix)
        region.url = await imageDataToDataUrl(imageData)
        return region
    }

// newRegion$
//     .pipe(
//         mergeMap(renderRegion),
//     )
//     .subscribe(RenderedRegion$)

