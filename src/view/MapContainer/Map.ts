import { Container, Loader, SCALE_MODES, Sprite } from "pixi.js"
import { bufferTime, filter, concatMap } from "rxjs"
import { MapRegion } from "../../model/"
import { viewport$ } from "../../store/Map"
import { RenderedRegion$ } from "../../store/MapData"

export const mapContainer = new Container()
mapContainer.sortableChildren = true
mapContainer.zIndex = 0

viewport$.subscribe(({ position, scale }) => {
    mapContainer.position.set(...position)
    mapContainer.scale.set(scale, scale)
})

function loadRenderedRegions(regions: MapRegion[]): Promise<MapRegion[]> {
    regions.forEach(r => Loader.shared.add(`${r.id}`, r.url))
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
        sprite.x = region.position[0] - 0.5
        sprite.y = region.position[1] - 0.5
        mapContainer.addChild(sprite)
    })
})
