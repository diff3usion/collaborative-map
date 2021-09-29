import { Container, Loader, SCALE_MODES, Sprite, Ticker } from "pixi.js"
import { bufferTime, filter, concatMap } from "rxjs"
import { MapRegion } from "../../model/"
import { viewport$ } from "../../store/Map"
import { RenderedRegion$ } from "../../store/MapData"
import { PlaneVector } from "../../Type"
import { pointToVector } from "../../utils"
import { TransitionTicker } from "../../utils/animation"
import { linear, transitionVector } from "../../utils/transition"

export const mapContainer = new Container()
mapContainer.sortableChildren = true
mapContainer.zIndex = 0

let positionTransitioning: TransitionTicker<PlaneVector> | undefined;
let scaleTransitioning: TransitionTicker<number> | undefined;

viewport$.subscribe(({ position, scale }) => {
    // if (animation) {
    //     if (!positionTransitioning) {
    //         positionTransitioning = new TransitionTicker(Ticker.shared, {
    //             duration: animation.duration,
    //             from: pointToVector(mapContainer.position),
    //             to: position,
    //             fn: vectorTransition(linear),
    //             apply: v => mapContainer.position.set(...v),
    //             complete: () => positionTransitioning = undefined
    //         }).start()
    //     } else {
    //         positionTransitioning.revise({ to: position, duration: animation.duration })
    //     }
    //     if (!scaleTransitioning) {
    //         scaleTransitioning = new TransitionTicker(Ticker.shared, {
    //             duration: animation.duration,
    //             from: mapContainer.scale.x,
    //             to: scale,
    //             fn: linear,
    //             apply: s => mapContainer.scale.set(s),
    //             complete: () => scaleTransitioning = undefined
    //         }).start()
    //     } else {
    //         scaleTransitioning.revise({ to: scale, duration: animation.duration })
    //     }
    // } else {
        mapContainer.position.set(...position)
        mapContainer.scale.set(scale, scale)
    // }
})

const loadRenderedRegions: (regions: MapRegion[]) => Promise<MapRegion[]>
    = regions => {
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

