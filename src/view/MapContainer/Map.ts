import * as PIXI from "pixi.js"
import { Container, Loader, SCALE_MODES, Sprite } from "pixi.js"
import { bufferTime, filter, concatMap } from "rxjs"
import { mapApp } from "."
import { MapRegion } from "../../model/map/Data"
import { viewportUpdate$ } from "../../store/Map"
import { RenderedRegion$ } from "../../store/MapData"
import { pointToVector } from "../../utils"
import { transitionPosition, transitionScale } from "../../utils/animation"

export const mapContainer = new Container()
mapContainer.sortableChildren = true
mapContainer.zIndex = 0

const transitionFrames = 12

viewportUpdate$.subscribe(({ viewport: { position, scale }, animated }) => {
    if (animated) {
        transitionPosition(transitionFrames, mapContainer, pointToVector(mapContainer.position), position).start()
        transitionScale(transitionFrames, mapContainer, mapContainer.scale.x, scale).start()
    } else {
        mapContainer.position.set(...position)
        mapContainer.scale.set(scale, scale)
    }
})

const loadRenderedRegions: (regions: MapRegion[]) => Promise<MapRegion[]>
    = regions => {
        regions.forEach(r => Loader.shared.add(r.id, r.url))
        return new Promise<MapRegion[]>((resolve, reject) => {
            Loader.shared.load(() => resolve(regions))
            Loader.shared.onError = reject
        })
    }

RenderedRegion$.pipe(
    bufferTime(100),
    filter(arr => arr.length > 0),
    concatMap(loadRenderedRegions)
).subscribe(regions => {
    regions.map(region => {
        const texture = Loader.shared.resources[region.id].texture
        if (!texture) return
        texture.baseTexture.scaleMode = SCALE_MODES.NEAREST
        const sprite = new Sprite(texture)
        sprite.x = region.minX - 0.5
        sprite.y = region.minZ - 0.5
        mapContainer.addChild(sprite)
    })
})

