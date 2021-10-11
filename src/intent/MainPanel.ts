import { map, shareReplay, Subject } from "rxjs";
import { PlaneVector } from "../Type";
import { distinctPlaneVector } from "../utils/rx";

export const mainPanelResizeObserverEntry$: Subject<ResizeObserverEntry> = new Subject()
export const mainPanelSize$ = mainPanelResizeObserverEntry$.pipe(
    map(e => <PlaneVector>[e.contentRect.width, e.contentRect.height]),
    distinctPlaneVector(),
    shareReplay(1),
)
