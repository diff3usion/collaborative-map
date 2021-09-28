///<reference path="path_to_ts/pixi-layers.d.ts">

import * as PIXI from "pixi.js"
import { InteractionManager } from "pixi.js"
import { useEffect, useRef } from "react"

import { mainPanelSize$ } from "../../intent/MainPanel"
import { useEventObserver } from '../../utils/hook'
import { rendererCursorStyle$ } from "../../store/Map"
import {
    canvasContextMenu$,
    canvasWheel$,
    canvasPointerDown$,
    canvasPointerMove$,
    canvasPointerUp$,
} from "../../intent/Map"
import { markingContainer } from "./marker/Marking"
import { mapContainer } from "./Map"
import { observeEvent } from "../../utils/rx"
import { documentKeyPress$ } from "../../intent/Control"
import { gridContainer } from "./grid/"

PIXI.settings.FILTER_RESOLUTION = devicePixelRatio

export const mapApp = new PIXI.Application({
    backgroundColor: 0xB9D9EB,
    resolution: devicePixelRatio,
    autoDensity: true,
    antialias: true,
});

mapApp.stage.sortableChildren = true
mapApp.stage.addChild(mapContainer)
mapApp.stage.addChild(gridContainer)
mapApp.stage.addChild(markingContainer)

const mapRendererInteraction = mapApp.renderer.plugins.interaction as InteractionManager
mapRendererInteraction.moveWhenInside = true

const setDefaultCursorMode: (cursorMode: string) => void
    = cursorMode => {
        mapRendererInteraction.cursorStyles.default = cursorMode
        mapRendererInteraction.setCursorMode(cursorMode)
    }

rendererCursorStyle$.subscribe(setDefaultCursorMode)

mainPanelSize$.subscribe(size => {
    mapApp.renderer.resize(...size)
})


observeEvent(document, 'keypress', documentKeyPress$)

export const MapContainer = () => {
    const mapCanvas = useRef<HTMLCanvasElement>(mapApp.view)
    const container = useRef<HTMLDivElement>(null)

    useEventObserver(mapApp.view, 'contextmenu', canvasContextMenu$)
    useEventObserver(mapApp.view, 'wheel', canvasWheel$)
    useEventObserver(mapApp.view, 'pointermove', canvasPointerMove$)
    useEventObserver(mapApp.view, 'pointerdown', canvasPointerDown$)
    useEventObserver(mapApp.view, 'pointerup', canvasPointerUp$)

    useEffect(() => {
        container.current!.appendChild(mapCanvas.current)
    }, [])

    return (
        <div id="map-container" ref={container} />
    )
}
