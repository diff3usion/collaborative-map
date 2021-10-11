import { map, withLatestFrom, merge, tap } from "rxjs"
import { controlModeCursorStyles } from "../Constant"
import { distinctPlaneVector, filterWithLatestFrom, scanInitializedWithLatestFrom } from "../utils/rx"
import { vectorRound } from "../utils/geometry"
import { eventToPosition } from "../utils/event"

import { locationOfPosition } from "../model/"
import { documentPointerUp$ } from "../intent"
import { canvasPointerDown$, canvasPointerMove$, canvasPointerUp$, canvasPointerUpOutside$ } from "../intent/Map"
import { mapToRelativePosition, cursorRelativePosition$, cursorRoundedRelativePosition$, rendererCursorStyle$, canvasPointersCurrentlyDown$, canvasPointersCurrentlyDownIdMap$, canvasPointersDownAndMoved$ } from "../store/Map"
import { controlMode$ } from "../store/MapControl"
import { cursorLocation$ } from "../store/MapData"

//#region Default Cursor Style for Control Modes
controlMode$
    .pipe(
        map(mode => controlModeCursorStyles[mode]),
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

//#region Cursor Currently Down
canvasPointerDown$
    .pipe(
        withLatestFrom(canvasPointersCurrentlyDown$),
        map(([event, down]) => [...down, event]),
    )
    .subscribe(canvasPointersCurrentlyDown$)
merge(canvasPointerUp$, canvasPointerUpOutside$)
    .pipe(
        withLatestFrom(canvasPointersCurrentlyDown$),
        map(([event, down]) => down.filter(e => e.pointerId !== event.pointerId)),
    )
    .subscribe(canvasPointersCurrentlyDown$)
//#endregion

//#region Cursor Down and Moved
canvasPointerMove$
    .pipe(
        filterWithLatestFrom(canvasPointersCurrentlyDownIdMap$, (down, event) => down.has(event.pointerId)),
        scanInitializedWithLatestFrom(
            canvasPointersCurrentlyDown$,
            (cumu, event) => [...cumu.filter(e => e.pointerId !== event.pointerId), event],
        ),
    )
    .subscribe(canvasPointersDownAndMoved$)
//#endregion

documentPointerUp$
    .pipe(
        filterWithLatestFrom(canvasPointersCurrentlyDown$, down => down.length > 0)
    )
    .subscribe(canvasPointerUpOutside$)
