import { BehaviorSubject, Subject } from "rxjs"
import { markingTypeMaxPointsMap } from "../Constant"
import { MapControlMode, MapMarkingMode, MapMarkingStage } from "../type"
import { PlaneVector } from "../type/geometry"
import { filterWithMultipleLatestFrom, filterThatLatestEquals } from "../utils/rx"
import { filterControlMode } from "./MapControl"

export const markingMode$ = new BehaviorSubject<MapMarkingMode>(MapMarkingMode.Point)
export const markingStage$ = new BehaviorSubject<MapMarkingStage>(MapMarkingStage.Drawing)

export const tempPoint$ = new Subject<PlaneVector>()
export const placedPoints$ = new BehaviorSubject<PlaneVector[]>([])
export const confirmedPoints$ = new Subject<PlaneVector[]>()

export const filterIsMarkingMode = () => filterControlMode(MapControlMode.Marking)

const filterMarkingStage = filterThatLatestEquals(markingStage$)
export const filterIsDrawingStage = () => filterMarkingStage(MapMarkingStage.Drawing)
export const filterIsSpecifyingStage = () => filterMarkingStage(MapMarkingStage.Specifying)

export const filterCanPlaceMorePoints = () =>
    filterWithMultipleLatestFrom(placedPoints$, markingMode$)
        (([placedPoints, mode]) => placedPoints.length < markingTypeMaxPointsMap[mode])
