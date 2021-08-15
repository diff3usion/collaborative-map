import { BehaviorSubject, Observable, withLatestFrom, filter, map } from "rxjs"
import { MapControlMode } from "../Type"

export const controlMode$ = new BehaviorSubject<MapControlMode>(MapControlMode.Explore)

export const filterControlMode: <T>(mode: MapControlMode) => (ob: Observable<T>) => Observable<T>
    = mode => ob => ob.pipe(
        withLatestFrom(controlMode$),
        filter(([_, currentMode]) => currentMode === mode),
        map(([v]) => v)
    )