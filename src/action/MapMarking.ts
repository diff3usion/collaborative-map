import { distinctUntilChanged, map, tap, withLatestFrom, of, merge, share, scan, mapTo, OperatorFunction, MonoTypeOperatorFunction } from "rxjs";
import { markingTypeDropdownKeyMap } from "../Constant";
import { markingTypeControlSelectedOption$ } from "../intent/Control";
import { canvasPointerDown$, canvasPointerMove$, canvasPointerUp$ } from "../intent/Map";
import { endPointPointerUp$, placedPointPointerUp$, tempPointPointerUp$ } from "../intent/MapMarking";
import { filterSinglePointerIsDown, mapToRelativePosition, viewport$, viewportFocusRect } from "../store/Map";
import { placedPoints$, markingMode$, tempPoint$, filterCanPlaceMorePoints, confirmedPoints$, filterIsMarkingMode, filterIsDrawingStage, markingStage$ } from "../store/MapMarking";
import { MapMarkingStage, PlaneVector } from "../Type";
import { eventToPosition, eventToTargetRelativePosition } from "../utils";
import { planeVectorsBoundingRect, planeVectorUnshift, rectCenter, scaleRectWithMinSize, vectorRound } from "../utils/geometry";
import { distinctPlaneVector, switchToLastestFrom, windowEachStartWith } from "../utils/rx";

function filterMayDrawNewPoint<T>(): MonoTypeOperatorFunction<T> {
    return ob => ob.pipe(
        filterIsMarkingMode(),
        filterIsDrawingStage(),
        filterCanPlaceMorePoints(),
    )
}

markingTypeControlSelectedOption$
    .pipe(
        map(o => markingTypeDropdownKeyMap.get(o.key as string)!),
        distinctUntilChanged(),
    )
    .subscribe(markingMode$)

//#region New Temp Point
const newTempPointEvent$ = canvasPointerDown$
    .pipe(
        filterMayDrawNewPoint(),
    )
const tempPointMoveEvent$ = canvasPointerMove$
    .pipe(
        filterSinglePointerIsDown(),
        filterMayDrawNewPoint(),
    )
const tempPointUpdateEvent$ =
    merge(
        tempPointMoveEvent$,
        newTempPointEvent$,
    )
tempPointUpdateEvent$
    .pipe(
        map(eventToPosition),
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
function mapToAction(type: MarkingActionType): OperatorFunction<PlaneVector, MarkingAction> {
    return ob => ob.pipe(map(v => [v, type]))
}
function applyMarkingAction(vectors: PlaneVector[], [target, actionType]: MarkingAction): PlaneVector[] {
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

const addPlacedPointEvent$ =
    merge(
        canvasPointerUp$,
        tempPointPointerUp$,
    ).pipe(
        filterMayDrawNewPoint(),
        switchToLastestFrom(tempPointUpdateEvent$),
    )
const addAction$ = addPlacedPointEvent$
    .pipe(
        map(eventToPosition),
        mapToRelativePosition(),
        map(vectorRound),
        mapToAction(MarkingActionType.Add),
        windowEachStartWith(markingMode$, clearAction()),
    )
const deletePlacedPointEvent$ = placedPointPointerUp$
    .pipe(
        filterIsMarkingMode(),
        filterIsDrawingStage(),
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
)
    .pipe(
        scan(applyMarkingAction, []),
    ).subscribe(placedPoints$)
//#endregion


//#region Marking End
const markingEndEvent$ = endPointPointerUp$
    .pipe(
        filterIsMarkingMode(),
        // filterIsDrawingStage(),
    )
markingEndEvent$
    .pipe(
        switchToLastestFrom(placedPoints$),
    )
    .subscribe(confirmedPoints$)

confirmedPoints$
    .pipe(
        mapTo(MapMarkingStage.Specifying),
    )
    .subscribe(markingStage$)

confirmedPoints$
    .pipe(
        map(vectors => {
            const fitted = planeVectorsBoundingRect(vectors)
            return scaleRectWithMinSize(fitted, 1.2, rectCenter(fitted), 16)
        }),
        viewportFocusRect(),
    )
    .subscribe(viewport$)
//#endregion
