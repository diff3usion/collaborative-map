import { BehaviorSubject, Subject } from "rxjs";
import { MapLocation, MapRegion } from "../model/map/Data";

export const cursorLocation$ = new BehaviorSubject<MapLocation | undefined>(undefined)

export const RenderedRegion$ = new Subject<MapRegion>()

