import { map, merge, mapTo } from "rxjs"
import { rendererPointerDown$, rendererPointerMove$, rendererPointerUp$, rendererPointerUpOutside$ } from "../intent/Map"
import { locationOfPosition } from "../model/"
import { controlModeCursorStyles } from "../Constant"
import { distinctPlaneVector, filterWithoutTarget, mapToEventGlobalPosition } from "../utils/rx"
import { cursorLocation$ } from "../store/MapData"
import { vectorRound } from "../utils/geometry"
import { mapToRelativePosition, cursorRelativePosition$, cursorRoundedRelativePosition$, rendererPointerIsDown$, rendererCursorStyle$ } from "../store/Map"
import { controlMode$ } from "../store/MapControl"

rendererPointerMove$
    .pipe(
        mapToEventGlobalPosition(),
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

merge(
    rendererPointerDown$.pipe(filterWithoutTarget(), map(e => e.data.button)),
    merge(rendererPointerUp$, rendererPointerUpOutside$).pipe(mapTo(-1))
).subscribe(rendererPointerIsDown$)

controlMode$
    .pipe(
        map(mode => controlModeCursorStyles.get(mode)!),
    )
    .subscribe(rendererCursorStyle$)

