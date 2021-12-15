import { map, withLatestFrom, merge } from "rxjs"
import { controlModeCursorStyles } from "../Constant"
import { GestureEvent, GesturePosition } from "../type/event"
import { eventToPosition } from "../utils/event"
import { vectorRound } from "../utils/math"
import { filterWithLatestFrom, scanInitializedWithLatestFrom, windowPairwise } from "../utils/rx"

import { locationOfPosition } from "../model/"
import { documentPointerUp$ } from "../intent"
import { canvasPointerDown$, canvasPointerMove$, canvasPointerUp$, canvasPointerUpOutside$, canvasTwoFingerGesture$ } from "../intent/Map"
import { mapToRelativePosition, cursorRelativePosition$, cursorRoundedRelativePosition$, rendererCursorStyle$, canvasPointersCurrentlyDown$, canvasPointersCurrentlyDownIdMap$, canvasPointersDownAndMoved$, canvasPointersDownAndMovedIdMap$, filterPointerDownCount } from "../store/Map"
import { controlMode$ } from "../store/MapControl"
import { cursorLocation$ } from "../store/MapData"
import { filterIsExploreMode } from "../store/MapExplore"
import { distinctPlaneVector } from "../utils/plane"

//#region Default Cursor Style for Control Modes
// SS
controlMode$
    .pipe(
        map(mode => controlModeCursorStyles[mode]),
    ).subscribe(rendererCursorStyle$)
//#endregion

//#region Cursor Position Related Info
// IS
canvasPointerMove$
    .pipe(
        map(eventToPosition),
        distinctPlaneVector(),
        mapToRelativePosition(),
    )
    .subscribe(cursorRelativePosition$)
// SS
cursorRelativePosition$
    .pipe(map(vectorRound))
    .subscribe(cursorRoundedRelativePosition$)
// SS
cursorRoundedRelativePosition$
    .pipe(map(locationOfPosition))
    .subscribe(cursorLocation$)
//#endregion

//#region Cursor Currently Down
// IS
canvasPointerDown$
    .pipe(
        withLatestFrom(canvasPointersCurrentlyDown$),
        map(([event, down]) => [...down, event]),
    )
    .subscribe(canvasPointersCurrentlyDown$)
// IS
merge(canvasPointerUp$, canvasPointerUpOutside$)
    .pipe(
        withLatestFrom(canvasPointersCurrentlyDown$),
        map(([event, down]) => down.filter(e => e.pointerId !== event.pointerId)),
    )
    .subscribe(canvasPointersCurrentlyDown$)
//#endregion

//#region Cursor Down and Moved
// IS
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

//#region Pointer Up Outside
// II
documentPointerUp$
    .pipe(
        filterWithLatestFrom(canvasPointersCurrentlyDown$, down => down.length > 0)
    )
    .subscribe(canvasPointerUpOutside$)
//#endregion

//#region Gesture
// II
canvasPointersDownAndMovedIdMap$
    .pipe(
        filterIsExploreMode(),
        filterPointerDownCount(2),
        map(idMap => Array.from(idMap.entries()).sort(([id0], [id1]) => id0 - id1)),
        map(sortedEntries => sortedEntries.map(([_, e]) => e) as GestureEvent<2>),
        map(events => events.map(eventToPosition) as GesturePosition<2>),
        windowPairwise(canvasPointersCurrentlyDown$),
    )
    .subscribe(canvasTwoFingerGesture$)
//#endregion
