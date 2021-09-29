import { distinctUntilChanged, filter, mapTo, merge } from "rxjs"
import { bottomControlExploreClick$, bottomControlMarkingClick$, bottomControlUploadsClick$, documentKeyPress$ } from "../intent/Control"
import { controlMode$ } from "../store/MapControl"
import { MapControlMode } from "../Type"

//#region Switching Control Mode
merge(
    controlMode$,
    bottomControlExploreClick$.pipe(
        mapTo(MapControlMode.Explore)
    ),
    bottomControlMarkingClick$.pipe(
        mapTo(MapControlMode.Marking)
    ),
    bottomControlUploadsClick$.pipe(
        mapTo(MapControlMode.Uploads)
    ),
    documentKeyPress$.pipe(
        filter(e => e.key === 'n'),
        mapTo(MapControlMode.Explore),
    ),
    documentKeyPress$.pipe(
        filter(e => e.key === 'm'),
        mapTo(MapControlMode.Marking),
    ),
).pipe(
    distinctUntilChanged(),
).subscribe(controlMode$)
//#endregion
