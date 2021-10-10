import { Container } from 'pixi.js'
import { filter, map, mapTo, mergeWith, Observable, pairwise, Subject, tap, withLatestFrom } from 'rxjs'
import { confirmedPoints$, markingStage$, placedPoints$, tempPoint$ } from '../../../store/MapMarking'
import { MapMarkingStage } from '../../../Type'
import { filterWithLatestFrom, mergeWithSignalAs, partitionWithLatestFrom } from '../../../utils/rx'
import { mapToMarkingGraphicGroup as mapToMarkingGraphicsGroup, MarkingGraphicsGroup, MarkingGraphicsType } from './MarkingGraphicsGroup'

export const markingContainer = new Container()
markingContainer.sortableChildren = true
markingContainer.zIndex = 10

const updateMarkingGraphicsGroup = ([prev, curr]: (MarkingGraphicsGroup | undefined)[]) => {
    prev?.remove()
    curr?.display()
}

const tempPointGraphics$ = new Subject<MarkingGraphicsGroup | undefined>()

const tempPointWithPlaced$ = tempPoint$
    .pipe(
        withLatestFrom(placedPoints$),
        map(([temp, arr]) => [...arr, temp]),
        // mergeWithSignalAs(placedPoints$, [])
    )

const [tempPointToInit$, tempPointToUpdate$] = partitionWithLatestFrom(
    tempPointWithPlaced$,
    tempPointGraphics$,
    group => group === undefined
)
const initedTempPoint$ = tempPointToInit$.pipe(
    mapToMarkingGraphicsGroup(MarkingGraphicsType.Temp),
)
initedTempPoint$
    .subscribe(tempPointGraphics$)
tempPointToUpdate$.pipe(
    withLatestFrom(tempPointGraphics$),
)

tempPoint$.pipe(
    withLatestFrom(placedPoints$),
    map(([temp, arr]) => [...arr, temp]),
    mapToMarkingGraphicsGroup(MarkingGraphicsType.Temp),
    mergeWithSignalAs(placedPoints$, undefined),
    mergeWithSignalAs(confirmedPoints$, undefined),
    pairwise(),
).subscribe(updateMarkingGraphicsGroup)

placedPoints$
    .pipe(
        mapToMarkingGraphicsGroup(MarkingGraphicsType.Placed),
        mergeWith(confirmedPoints$.pipe(mapTo(undefined))),
    )
    .subscribe(tempPointGraphics$)

confirmedPoints$.pipe(
    mapToMarkingGraphicsGroup(MarkingGraphicsType.Confirmed),
    mergeWith(markingStage$.pipe(
        filter(stage => stage === MapMarkingStage.Drawing),
        mapTo(undefined),
    )),
    pairwise(),
).subscribe(updateMarkingGraphicsGroup)
