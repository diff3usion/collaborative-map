import { distinctUntilChanged, filter, mapTo, merge } from "rxjs"

import { documentKeyPress$ } from "../intent"
import { bottomControlExploreClick$, bottomControlMarkingClick$, bottomControlUploadsClick$ } from "../intent/Control"
import { controlMode$ } from "../store/MapControl"
import { MapControlMode } from "../type"

//#region Switching Control Mode
const controlModeSwitchActions =
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
    )
controlModeSwitchActions
    .pipe(
        distinctUntilChanged(),
    )
    .subscribe(controlMode$)
//#endregion
