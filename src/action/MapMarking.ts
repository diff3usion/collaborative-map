import { distinctUntilChanged, map, tap, window, withLatestFrom, startWith, of, switchMap, merge, mergeWith, share, scan, Observable } from "rxjs";
import { markingTypeDropdownKeyMap } from "../Constant";
import { markingTypeControlSelectedOption$ } from "../intent/Control";
import { rendererPointerDown$, rendererPointerMove$, rendererPointerUp$ } from "../intent/Map";
import { placedPointPointerUp$, tempPointPointerUp$ } from "../intent/MapMarking";
import { MapControlMode } from "../model/Type";
import { filterPointerIsDown, mapToRelativePosition, scale$, viewport$ } from "../store/Map";
import { filterControlMode } from "../store/MapControl";
import { placedPoints$, markingMode$, tempPoint$, filterCanPlaceMorePoints } from "../store/MapMarking";
import { EventButtonType, PlaneVector } from "../Type";
import { planeVectorUnshift, vectorRound, vectorTimes } from "../utils/geometry";
import { distinctPlaneVector,  filterEventButton, filterWithoutTarget, mapToEventGlobalPosition, mapToEventTargetRelativePosition, switchToLastestFrom } from "../utils/rx";

markingTypeControlSelectedOption$
    .pipe(
        map(o => markingTypeDropdownKeyMap.get(o.key as string)!),
        distinctUntilChanged(),
    )
    .subscribe(markingMode$)

const newTempPointEvent$ = rendererPointerDown$
    .pipe(
        filterWithoutTarget(),
        filterEventButton(EventButtonType.Main),
        mergeWith(rendererPointerMove$.pipe(filterPointerIsDown(EventButtonType.Main))),
        filterControlMode(MapControlMode.Marking),
        filterCanPlaceMorePoints(),
    )
newTempPointEvent$
    .pipe(
        mapToEventGlobalPosition(),
        distinctPlaneVector(),
        mapToRelativePosition(),
        map(vectorRound),
        distinctPlaneVector(),
    )
    .subscribe(tempPoint$)

type MarkingAction = [PlaneVector, MarkingActionType]
enum MarkingActionType {
    Clear,
    Add,
    Delete,
}
const clearAction = () => [[0, 0], MarkingActionType.Clear] as MarkingAction
const mapToAction: (type: MarkingActionType) => (ob: Observable<PlaneVector>) => Observable<MarkingAction>
    = type => ob => ob.pipe(map(v => [v, type]))
const applyMarkingAction: (vectors: PlaneVector[], current: MarkingAction) => PlaneVector[]
    = (vectors, [target, actionType]) => {
        switch (actionType) {
            case MarkingActionType.Add:
                return [...vectors, target]
            case MarkingActionType.Delete:
                console.log(target, vectors)
                return vectors.filter(([x, y]) => target[0] !== x || target[1] !== y)
            default:
                return []
        }
    }

const addPlacedPointEvent$ = rendererPointerUp$
    .pipe(
        filterWithoutTarget(),
        mergeWith(tempPointPointerUp$),
        filterControlMode(MapControlMode.Marking),
        filterEventButton(EventButtonType.Main),
        filterCanPlaceMorePoints(),
        switchToLastestFrom(newTempPointEvent$),
    )
const addAction$ = addPlacedPointEvent$.pipe(
    mapToEventGlobalPosition(),
    mapToRelativePosition(),
    map(vectorRound),
    window(markingMode$),
    switchMap(ob => ob.pipe(mapToAction(MarkingActionType.Add), startWith(clearAction()))),
)
const deletePlacedPointEvent$ = placedPointPointerUp$
    .pipe(
        filterControlMode(MapControlMode.Marking),
        filterEventButton(EventButtonType.Secondary),
    )
const deleteAction$ = deletePlacedPointEvent$
    .pipe(
        mapToEventTargetRelativePosition(),
        withLatestFrom(viewport$),
        map(([targetPos, viewport]) => vectorRound(planeVectorUnshift(targetPos, viewport))),
        withLatestFrom(of(MarkingActionType.Delete)),
        share(),
    )

merge(
    addAction$,
    deleteAction$,
).pipe(
    scan(applyMarkingAction, []),
).subscribe(placedPoints$)
