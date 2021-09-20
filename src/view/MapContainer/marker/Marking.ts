import { Container } from 'pixi.js'
import { filter, map, mapTo, mergeWith, pairwise, tap, withLatestFrom } from 'rxjs'
import { confirmedPoints$, markingStage$, placedPoints$, tempPoint$ } from '../../../store/MapMarking'
import { MapMarkingStage } from '../../../Type'
import { mergeWithSignalAs } from '../../../utils/rx'
import { mapToMarkingGraphicGroup, MarkingGraphicsGroup, MarkingGraphicsType } from './MarkingGraphicsGroup'

export const markingContainer = new Container()
markingContainer.sortableChildren = true
markingContainer.zIndex = 10

const updateMarkingGraphicsGroup = ([prev, curr]: (MarkingGraphicsGroup | undefined)[]) => {
    prev?.remove()
    curr?.display()
}

tempPoint$.pipe(
    withLatestFrom(placedPoints$),
    map(([temp, arr]) => [...arr, temp]),
    mapToMarkingGraphicGroup(MarkingGraphicsType.Temp),
    mergeWithSignalAs(placedPoints$, undefined),
    mergeWithSignalAs(confirmedPoints$, undefined),
    pairwise(),
).subscribe(updateMarkingGraphicsGroup)

placedPoints$.pipe(
    mapToMarkingGraphicGroup(MarkingGraphicsType.Placed),
    mergeWith(confirmedPoints$.pipe(mapTo(undefined))),
    pairwise(),
).subscribe(updateMarkingGraphicsGroup)

confirmedPoints$.pipe(
    mapToMarkingGraphicGroup(MarkingGraphicsType.Confirmed),
    mergeWith(markingStage$.pipe(
        filter(stage => stage === MapMarkingStage.Drawing),
        mapTo(undefined),
    )),
    pairwise(),
).subscribe(updateMarkingGraphicsGroup)
