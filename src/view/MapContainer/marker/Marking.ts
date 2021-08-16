import { Container } from 'pixi.js'
import { map, mapTo, mergeWith, pairwise, withLatestFrom } from 'rxjs'
import { placedPoints$, tempPoint$ } from '../../../store/MapMarking'
import { mapToMarkingGraphicGroup } from './MarkingGraphicsGroup'

export const markingContainer = new Container()
markingContainer.sortableChildren = true
markingContainer.zIndex = 10

tempPoint$.pipe(
    withLatestFrom(placedPoints$),
    map(([temp, arr]) => [...arr, temp]),
    mapToMarkingGraphicGroup(true),
    mergeWith(placedPoints$.pipe(mapTo(undefined))),
    pairwise(),
).subscribe(([prev, curr]) => {
    prev?.remove()
    curr?.display()
})

placedPoints$.pipe(
    mapToMarkingGraphicGroup(),
    pairwise(),
).subscribe(([prev, curr]) => {
    prev.remove()
    curr.display()
})
