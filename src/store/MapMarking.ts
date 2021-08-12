import { BehaviorSubject, filter, map, Observable, Subject, withLatestFrom } from "rxjs"
import { markingTypeMaxPointsMap } from "../Constant"
import { MapMarkingMode, PlaneVector } from "../Type"

export const markingMode$ = new BehaviorSubject<MapMarkingMode>(MapMarkingMode.Point)

export const tempPoint$ = new Subject<PlaneVector>()
export const placedPoints$ = new BehaviorSubject<PlaneVector[]>([])

export const filterCanPlaceMorePoints: <T>() => (ob: Observable<T>) => Observable<T>
    = () =>
        ob => ob.pipe(
            withLatestFrom(placedPoints$, markingMode$),
            filter(([_, placedPoints, mode]) => placedPoints.length < markingTypeMaxPointsMap.get(mode)!),
            map(([v]) => v),
        )
