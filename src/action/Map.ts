import { canvasPointerDown$, canvasPointerMove$, canvasPointerUp$, canvasPointerUpOutside$ } from "../intent/Map"
import { locationOfPosition } from "../model/"
import { controlModeCursorStyles } from "../Constant"
import { distinctPlaneVector, filterWithLatestFrom, observeEvent } from "../utils/rx"
import { cursorLocation$ } from "../store/MapData"
import { vectorRound } from "../utils/geometry"
import { mapToRelativePosition, cursorRelativePosition$, cursorRoundedRelativePosition$, rendererCursorStyle$, canvasPointersCurrentlyDown$ } from "../store/Map"
import { controlMode$ } from "../store/MapControl"
import { map, withLatestFrom, merge, tap, Subject } from "rxjs"
import { eventToPosition } from "../utils"

//#region Default Cursor Style for Control Modes
controlMode$
    .pipe(
        map(mode => controlModeCursorStyles.get(mode)!),
    ).subscribe(rendererCursorStyle$)
//#endregion

//#region Cursor Position Related Info
canvasPointerMove$
    .pipe(
        map(eventToPosition),
        distinctPlaneVector(),
        mapToRelativePosition(),
    )
    .subscribe(cursorRelativePosition$)

cursorRelativePosition$
    .pipe(map(vectorRound))
    .subscribe(cursorRoundedRelativePosition$)

cursorRoundedRelativePosition$
    .pipe(map(locationOfPosition))
    .subscribe(cursorLocation$)
//#endregion

//#region Cursor Down Status
canvasPointerDown$
    .pipe(
        withLatestFrom(canvasPointersCurrentlyDown$),
        map(([event, isDown]) => [...isDown, event])
    )
    .subscribe(canvasPointersCurrentlyDown$)
merge(canvasPointerUp$, canvasPointerUpOutside$)
    .pipe(
        withLatestFrom(canvasPointersCurrentlyDown$),
        map(([event, isDown]) => isDown.filter(e => e.pointerId !== event.pointerId))
    )
    .subscribe(canvasPointersCurrentlyDown$)
//#endregion

const documentPointerUp$ = new Subject<PointerEvent>()
observeEvent(document, 'pointerup', documentPointerUp$)
documentPointerUp$
    .pipe(
        filterWithLatestFrom(canvasPointersCurrentlyDown$, down => down.length > 0)
    )
    .subscribe(canvasPointerUpOutside$)
