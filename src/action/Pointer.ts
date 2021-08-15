import { rendererPointerDown$, rendererPointerMove$, rendererPointerUp$ } from "../intent/Map"
import { filterPointerIsDown } from "../store/Map"
import { EventButtonType } from "../Type"
import { filterWithoutTarget, filterEventButton } from "../utils/rx"

export const mainButtonDown$ = rendererPointerDown$
    .pipe(
        filterEventButton(EventButtonType.Main),
    )
export const mainButtonUp$ = rendererPointerUp$
    .pipe(
        filterEventButton(EventButtonType.Main),
    )
export const mainButtonDownOnBackground$ = mainButtonDown$
    .pipe(
        filterWithoutTarget(),
    )
export const mainButtonUpOnBackground$ = mainButtonUp$
    .pipe(
        filterWithoutTarget(),
    )
export const mainButtonDownAndMove$ = rendererPointerMove$
    .pipe(
        filterPointerIsDown(EventButtonType.Main),
    )
