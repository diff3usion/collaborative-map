import { map } from "rxjs";
import { canvasSinglePointerDown$, rendererCursorStyle$ } from "../store/Map";
import { filterIsExploreMode } from "../store/MapExplore";

//#region Grabbing Cursor Style
canvasSinglePointerDown$
    .pipe(
        filterIsExploreMode(),
        map(down => down ? 'grabbing' : 'grab')
    )
    .subscribe(rendererCursorStyle$)
//#endregion
