import { BehaviorSubject, filter, map, Observable, Subject, withLatestFrom } from "rxjs"
import { markingTypeMaxPointsMap } from "../Constant"
import { MapControlMode, MapMarkingMode, MapMarkingStage, PlaneVector } from "../Type"
import { filterWithMultipleLatestFrom, filterThatLatestEquals } from "../utils/rx"
import { filterControlMode } from "./MapControl"

export const markingMode$ = new BehaviorSubject<MapMarkingMode>(MapMarkingMode.Point)
export const markingStage$ = new BehaviorSubject<MapMarkingStage>(MapMarkingStage.Drawing)

export const tempPoint$ = new Subject<PlaneVector>()
export const placedPoints$ = new BehaviorSubject<PlaneVector[]>([])
export const confirmedPoints$ = new BehaviorSubject<PlaneVector[]>([])

export const filterIsMarkingMode = () => filterControlMode(MapControlMode.Marking)

const filterMarkingStage = filterThatLatestEquals(markingStage$)
export const filterIsDrawingStage = filterMarkingStage(MapMarkingStage.Drawing)
export const filterIsSpecifyingStage = filterMarkingStage(MapMarkingStage.Specifying)

export const filterCanPlaceMorePoints = () =>
    filterWithMultipleLatestFrom(placedPoints$, markingMode$)
        (([placedPoints, mode]) => placedPoints.length < markingTypeMaxPointsMap.get(mode)!)
