import { BehaviorSubject, distinctUntilChanged, filter, map, Observable, Observer, pairwise, shareReplay, Subject, withLatestFrom } from "rxjs"

import { EventButtonType, PlaneVector, ViewportUpdate } from "../Type"
import { distinctPlaneVector } from "../utils/rx"
import { globalToRelativePosition, relativeToGlobalPosition } from "../utils"

const viewportUpdateSubject = new BehaviorSubject<ViewportUpdate>({ viewport: { position: [0, 0], scale: 1 }, animated: false })
export const viewportUpdateObserver: Observer<ViewportUpdate> = viewportUpdateSubject
export const viewportUpdate$ = viewportUpdateSubject.pipe(
    shareReplay(1)
)

export const viewport$ = viewportUpdate$.pipe(map(({ viewport }) => viewport))

export const position$ = viewport$.pipe(
    map(({ position }) => position),
    distinctPlaneVector(),
)
export const scale$ = viewport$.pipe(
    map(({ scale }) => scale),
    distinctUntilChanged(),
)
export const rendererPointerIsDown$ = new BehaviorSubject<EventButtonType>(EventButtonType.None)

export const rendererCursorStyle$ = new BehaviorSubject<string>('grab')
export const cursorRelativePosition$ = new BehaviorSubject<PlaneVector>([0, 0])
export const cursorRoundedRelativePosition$ = new BehaviorSubject<PlaneVector>([0, 0])


export const filterPointerIsDown: <T>(...acceptable: EventButtonType[]) => (ob: Observable<T>) => Observable<T>
    = (...acceptable) => ob => ob.pipe(
        withLatestFrom(rendererPointerIsDown$),
        filter(([_, currentIsDown]) => acceptable.includes(currentIsDown)),
        map(([v]) => v)
    )

export const mapToRelativePosition: () => (ob: Observable<PlaneVector>) => Observable<PlaneVector>
    = () => ob => ob.pipe(
        withLatestFrom(viewport$),
        map(args => globalToRelativePosition(...args)),
    )
export const mapToGlobalPosition: () => (ob: Observable<PlaneVector>) => Observable<PlaneVector>
    = () => ob => ob.pipe(
        withLatestFrom(viewport$),
        map(args => relativeToGlobalPosition(...args)),
    )
