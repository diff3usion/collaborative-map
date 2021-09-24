import { tap } from "rxjs"
import { canvasPointerDown$, canvasPointerMove$, canvasPointerUp$ } from "../intent/Map"
import { filterSinglePointerIsDown } from "../store/Map"
import { MouseButtons } from "../Type"
import { filterWithoutTarget, filterEventButton } from "../utils/rx"

export const mainButtonDown$ = canvasPointerDown$
    .pipe(
        filterEventButton(MouseButtons.Left),
    )
export const mainButtonUp$ = canvasPointerUp$
    .pipe(
        filterEventButton(MouseButtons.Left),
    )
export const singleMainButtonDownAndMove$ = canvasPointerMove$
    .pipe(
        filterSinglePointerIsDown(MouseButtons.Left),
    )
