import { BehaviorSubject, Subject } from "rxjs";
import { MapLocation, MapRegion } from "../model/";

export const cursorLocation$ = new BehaviorSubject<MapLocation | undefined>(undefined)

export const RenderedRegion$ = new Subject<MapRegion>()

