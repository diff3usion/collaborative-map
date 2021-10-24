import { useEffect, useRef, useState } from "react";
import { CssVariables } from "..";
import { mainPanelResizeObserverEntry$ } from "../../intent/MainPanel";
import { useBehaviorSubjectAsState, useResizeObservedRef } from "../../utils/hook";
import { ButtomControl } from "./BottomControl";
import { BottomSubControl } from "./BottomSubControl";
import { FloatingWindow } from "./FloatingWindow";
import { InfoPanel } from "./InfoPanel";

import "./MainPanel.css"
import { MarkingTypeControl, markingTypeControlWidth } from "./MarkingSubControl";
import { MapContainer } from "../MapContainer";
import { controlMode$ } from "../../store/MapControl";
import { MapControlMode } from "../../type";
import { markingMode$ } from "../../store/MapMarking";
import { MarkerEditor } from "../MarkerEditor";

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

export const markerEditer = () => (
    <FloatingWindow
        className="new_marker_window"
        translate={[-200, -200]}
        title="新建标记"
        themeColor={CssVariables.themeColorMarking}
    >
        <MarkerEditor />
    </FloatingWindow>
)

export const MainPanel = () => {
    const [f, setF] = useState();
    const panel = useResizeObservedRef<HTMLDivElement>(mainPanelResizeObserverEntry$)
    const currentControlMode = useBehaviorSubjectAsState(controlMode$)
    const currentMarkingMode = useBehaviorSubjectAsState(markingMode$)

    return (
        <div id="main-panel" ref={panel} >
            <MapContainer />
            <InfoPanel />
            <ButtomControl />
            {subControls(currentControlMode)}
            {markerEditer()}
        </div>
    )
}
