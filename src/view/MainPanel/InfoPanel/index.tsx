import { useState } from "react"
import { useObservable, useObservableAsState } from "../../../utils/hook"
import "./InfoPanel.css"

import table from "../../../model/map/renderer/biome_id_table.json"
import { cursorLocation$ } from "../../../store/MapData"
import { cursorRoundedRelativePosition$ } from "../../../store/Map"

const biomeIdToName = new Map(table.table as [number, string][])

export const InfoPanel = () => {
    const mapCursorPosition = useObservableAsState(cursorRoundedRelativePosition$, [0, 0])
    const mapCursorLocation = useObservableAsState(cursorLocation$, undefined)
    const location = () => {
        if (!mapCursorLocation) return undefined
        return (<div>
            <div>biome {biomeIdToName.get(mapCursorLocation.biomeId!)}</div>
            {
                mapCursorLocation.blocks.map(b => <div>{b.height} {b.state?.id}</div>)
            }
        </div>)
    }
    return (
        <div id="info-panel"> 
            <div>x: {mapCursorPosition[0]} z: {mapCursorPosition[1]}</div>
            {location()}
        </div>
    )
}
