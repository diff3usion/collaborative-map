import { distinctUntilChanged, map, tap, window, withLatestFrom, startWith, of, switchMap, merge, share, scan, Observable, mapTo } from "rxjs";
import { markingTypeDropdownKeyMap } from "../Constant";
import { markingTypeControlSelectedOption$ } from "../intent/Control";
import { endPointPointerUp$, placedPointPointerUp$, tempPointPointerUp$ } from "../intent/MapMarking";
import { mapToRelativePosition, viewport$, viewportFocusRect, viewportUpdateObserver } from "../store/Map";
import { placedPoints$, markingMode$, tempPoint$, filterCanPlaceMorePoints, confirmedPoints$, filterIsMarkingMode, filterIsDrawingStage, markingStage$ } from "../store/MapMarking";
import { EventButtonType, MapMarkingStage, PlaneVector, ViewportUpdate } from "../Type";
import { eventToGlobalPosition, eventToTargetRelativePosition } from "../utils";
import { planeVectorsFitRect, planeVectorUnshift, rectCenter, scaleRectWithMinSize, vectorRound } from "../utils/geometry";
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
        filterIsMarkingMode(),
        filterIsDrawingStage(),
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
        filterIsMarkingMode(),
        filterIsDrawingStage(),
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
        filterIsMarkingMode(),
        filterIsDrawingStage(),
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


//#region Marking End
const markingEndEvent$ = endPointPointerUp$.pipe(
    filterIsMarkingMode(),
    // filterIsDrawingStage(),
)
markingEndEvent$.pipe(
    switchToLastestFrom(placedPoints$),
).subscribe(confirmedPoints$)

confirmedPoints$.pipe(
    mapTo(MapMarkingStage.Specifying),
).subscribe(markingStage$)

confirmedPoints$.pipe(
    map(vectors => {
        const fitted = planeVectorsFitRect(vectors)
        return scaleRectWithMinSize(fitted, 1.2, rectCenter(fitted), 16)
    }),
    viewportFocusRect(),
    map(viewport => ({ viewport, animated: true }) as ViewportUpdate),
).subscribe(viewportUpdateObserver)
//#endregion
