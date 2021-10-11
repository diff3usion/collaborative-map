///<reference path="path_to_ts/pixi-layers.d.ts">

import * as PIXI from "pixi.js"
import { InteractionManager } from "pixi.js"
import { useEffect, useMemo, useRef } from "react"

import { mainPanelSize$ } from "../../intent/MainPanel"
import { useEventObserver, useObservable, useResizeObserver } from '../../utils/hook'
import { rendererCursorStyle$ } from "../../store/Map"
import {
    canvasContextMenu$,
    canvasWheel$,
    canvasPointerDown$,
    canvasPointerMove$,
    canvasPointerUp$,
    canvasResizeObserverEntry$,
} from "../../intent/Map"
import { markingContainer } from "./marker/Marking"
import { mapContainer } from "./Map"
import { observeEvent } from "../../utils/rx"
import { gridContainer } from "./grid/"
import { PlaneVector } from "../../Type"

PIXI.settings.FILTER_RESOLUTION = devicePixelRatio

export const MapContainer = () => {
    const container = useRef<HTMLDivElement>(null)
    const application = useMemo(
        () => new PIXI.Application({
            backgroundColor: 0xB9D9EB,
            resolution: devicePixelRatio,
            autoDensity: true,
            antialias: true,
        }),
        [],
    )

    const canvas = () => application.view
    const stage = () => application.stage
    const renderer = () => application.renderer
    const interaction = () => renderer().plugins.interaction as InteractionManager
    const rendererResize = (size: PlaneVector) => renderer().resize(...size)
    const setCursorMode = (cursorMode: string) => {
        interaction().cursorStyles.default = cursorMode
        interaction().setCursorMode(cursorMode)
    }
    const initApplication = () => {
        stage().sortableChildren = true
        stage().addChild(mapContainer)
        stage().addChild(gridContainer)
        stage().addChild(markingContainer)
        interaction().moveWhenInside = true
    }

    useEffect(() => {
        initApplication()
        container.current!.appendChild(canvas())
    }, [])

    useObservable(mainPanelSize$, rendererResize)
    useObservable(rendererCursorStyle$, setCursorMode)
    useResizeObserver(canvas, canvasResizeObserverEntry$)
    useEventObserver(canvas, 'contextmenu', canvasContextMenu$)
    useEventObserver(canvas, 'wheel', canvasWheel$)
    useEventObserver(canvas, 'pointermove', canvasPointerMove$)
    useEventObserver(canvas, 'pointerdown', canvasPointerDown$)
    useEventObserver(canvas, 'pointerup', canvasPointerUp$)

    return (
        <div id="map-container" ref={container} />
    )
}
