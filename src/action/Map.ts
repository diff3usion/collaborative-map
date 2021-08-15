import { map, merge, mapTo } from "rxjs"
import { rendererPointerDown$, rendererPointerMove$, rendererPointerUp$, rendererPointerUpOutside$ } from "../intent/Map"
import { locationOfPosition } from "../model/"
import { controlModeCursorStyles } from "../Constant"
import { distinctPlaneVector, filterWithoutTarget } from "../utils/rx"
import { cursorLocation$ } from "../store/MapData"
import { vectorRound } from "../utils/geometry"
import { mapToRelativePosition, cursorRelativePosition$, cursorRoundedRelativePosition$, rendererPointerIsDown$, rendererCursorStyle$ } from "../store/Map"
import { controlMode$ } from "../store/MapControl"
import { eventToGlobalPosition } from "../utils"

//#region Default Cursor Style for Control Modes
controlMode$
    .pipe(
        map(mode => controlModeCursorStyles.get(mode)!),
    ).subscribe(rendererCursorStyle$)
//#endregion

//#region Cursor Position Related Info
rendererPointerMove$
    .pipe(
        map(eventToGlobalPosition),
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
merge(
    rendererPointerDown$.pipe(filterWithoutTarget(), map(e => e.data.button)),
    merge(rendererPointerUp$, rendererPointerUpOutside$).pipe(mapTo(-1))
).subscribe(rendererPointerIsDown$)
//#endregion
