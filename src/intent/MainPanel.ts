import { map, shareReplay, Subject } from "rxjs";
import { PlaneVector } from "../type/plane";
import { distinctPlaneVector } from "../utils/plane";

//#region Subjects
export const mainPanelResizeObserverEntry$: Subject<ResizeObserverEntry> = new Subject()
//#endregion

//#region Operators
export const mainPanelSize$ = mainPanelResizeObserverEntry$.pipe(
    map(e => <PlaneVector>[e.contentRect.width, e.contentRect.height]),
    distinctPlaneVector(),
    shareReplay(1),
)
//#endregion
