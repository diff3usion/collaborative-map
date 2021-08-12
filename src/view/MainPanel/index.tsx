import { useEffect, useRef, useState } from "react";
import { CssVariables } from "..";
import { mainPanelResizeObserverEntry$ } from "../../intent/MainPanel";
import { useBehaviorSubjectAsState, useResizeObservedRef } from "../../utils/hook";
import { ConceptEditor } from "../editor/ConceptEditor";
import { ButtomControl } from "./BottomControl";
import { BottomSubControl } from "./BottomSubControl";
import { FloatingWindow } from "./FloatingWindow";
import { InfoPanel } from "./InfoPanel";

import "./MainPanel.css"
import { MarkingTypeControl, markingTypeControlWidth } from "./MarkingSubControl";
import { MapControlMode } from "../../model/map/Type";
import { MapContainer } from "../MapContainer";
import { controlMode$ } from "../../store/MapControl";

const subControlMargin = 24

const subControls = (mode: MapControlMode) => {
    const markingTypeControlLeft = subControlMargin + markingTypeControlWidth;
    return [
        <MarkingTypeControl
            key='marking_type_control'
            display={mode === MapControlMode.Marking}
            style={{ left: `calc(((100% - ${CssVariables.bottomControlWidth}) / 2) - ${markingTypeControlLeft}px)` }}
        />,
    ]
}

export const MainPanel = () => {
    const panel = useResizeObservedRef<HTMLDivElement>(mainPanelResizeObserverEntry$)
    const currentControlMode = useBehaviorSubjectAsState(controlMode$)

    return (
        <div id="main-panel" ref={panel} >
            <MapContainer/>
            <InfoPanel />
            <ButtomControl />
            {subControls(currentControlMode)}
            <FloatingWindow
                title="新建标记"
                themeColor={CssVariables.themeColorMarking}
            >
                <ConceptEditor />
            </FloatingWindow>
        </div>
    )
}
