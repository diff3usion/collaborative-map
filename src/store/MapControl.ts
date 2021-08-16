import { BehaviorSubject, Observable, withLatestFrom, filter, map } from "rxjs"
import { MapControlMode } from "../Type"
import { filterThatLatestEquals } from "../utils/rx"

export const controlMode$ = new BehaviorSubject<MapControlMode>(MapControlMode.Explore)

export const filterControlMode = filterThatLatestEquals(controlMode$)
