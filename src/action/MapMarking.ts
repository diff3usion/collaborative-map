import { distinctUntilChanged, map, tap, window, withLatestFrom, startWith, of, switchMap, merge, share, scan, Observable } from "rxjs";
import { markingTypeDropdownKeyMap } from "../Constant";
import { markingTypeControlSelectedOption$ } from "../intent/Control";
import { placedPointPointerUp$, tempPointPointerUp$ } from "../intent/MapMarking";
import { mapToRelativePosition, viewport$ } from "../store/Map";
import { filterControlMode } from "../store/MapControl";
import { placedPoints$, markingMode$, tempPoint$, filterCanPlaceMorePoints } from "../store/MapMarking";
import { EventButtonType, MapControlMode, PlaneVector } from "../Type";
import { eventToGlobalPosition, eventToTargetRelativePosition } from "../utils";
import { planeVectorUnshift, vectorRound } from "../utils/geometry";
import { distinctPlaneVector, filterEventButton, switchToLastestFrom } from "../utils/rx";
import { mainButtonDownOnBackground$, mainButtonDownAndMove$, mainButtonUpOnBackground$ } from "./Pointer";

markingTypeControlSelectedOption$
    .pipe(
        map(o => markingTypeDropdownKeyMap.get(o.key as string)!),
        distinctUntilChanged(),
    )
    .subscribe(markingMode$)

//#region New Temp Point
const newTempPointEvent$ =
    merge(
        mainButtonDownOnBackground$,
        mainButtonDownAndMove$,
    ).pipe(
        filterControlMode(MapControlMode.Marking),
        filterCanPlaceMorePoints(),
    )

newTempPointEvent$
    .pipe(
        map(eventToGlobalPosition),
        mapToRelativePosition(),
        map(vectorRound),
        distinctPlaneVector(),
    )
    .subscribe(tempPoint$)
//#endregion

//#region Add / Delete Placed Points
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

const mainButtonUpTempPoint$ = tempPointPointerUp$
    .pipe(
        filterEventButton(EventButtonType.Main),
    )
const addPlacedPointEvent$ =
    merge(
        mainButtonUpOnBackground$,
        mainButtonUpTempPoint$,
    ).pipe(
        filterControlMode(MapControlMode.Marking),
        filterCanPlaceMorePoints(),
        switchToLastestFrom(newTempPointEvent$),
    )
const addAction$ = addPlacedPointEvent$.pipe(
    map(eventToGlobalPosition),
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
        map(eventToTargetRelativePosition),
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
//#endregion
