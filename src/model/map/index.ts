import _ from "lodash";
import { Observable, Subject, map, filter } from "rxjs"

import { PlaneRect, PlaneVector } from '../../type/geometry'
import { doesTwoRectsOverlap } from "../../utils/geometry"
import { MapLocation, MapRegion, UnIndexedRegion } from "./Data"

const regions: MapRegion[] = []
const region$: Subject<MapRegion> = new Subject()
export const regionProvider$: Subject<Observable<UnIndexedRegion>> = new Subject()

region$.subscribe(r => {
    regions.push(r)
})

regionProvider$.subscribe(provider =>
    provider
        .pipe(map(({ data, rect }) => new MapRegion(data, rect)))
        .subscribe(region$))

export const newRegion$: Observable<MapRegion> = region$

export const regionsOfRect: (rect: PlaneRect) => MapRegion[]
    = rect =>
        regions.filter(region => doesTwoRectsOverlap(rect, region.rect))

export const locationOfPosition: (position: PlaneVector) => MapLocation | undefined
    = ([x, z]) => {
        const includingRegions = regionsOfRect([[x, z], [1, 1]])
        if (!includingRegions[0]) return undefined
        return includingRegions[0].location(x, z)
    }

import("./Data")
import("./loader/VoxelMapLoader")
import("./renderer/McMapRenderer")

