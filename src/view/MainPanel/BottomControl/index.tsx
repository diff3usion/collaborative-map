import { CSSProperties } from "react"
import { initializeIcons, TooltipHost } from "@fluentui/react"
import { useId } from '@fluentui/react-hooks'
import { Property } from "csstype"

import "./BottomControl.css"
import { useBehaviorSubjectAsState, useEventObservedRef } from "../../../utils/hook"
import { BottomButton, BottomButtonStyle } from '../BottomButton'
import { CssVariables } from "../../"
import { bottomControlExploreClick$, bottomControlMarkingClick$, bottomControlUploadsClick$ } from "../../../intent/Control"
import { MapControlMode } from "../../../model/Type"
import { controlMode$ } from "../../../store/MapControl"

initializeIcons()

const buttonNormalStyle = { width: 96, height: 96, iconSizeRatio: 0.4, color: "#444444" }
const buttonHoverStyle: (c: Property.Color) => BottomButtonStyle
    = c => ({ width: 96, height: 96, iconSizeRatio: 0.4, color: c + '80', background: "#A6A8A3" + '80' })
const buttonActiveStyle = (c: Property.Color) => ({ width: 96, height: 96, iconSizeRatio: 0.6, color: c })

const ExploreButton: () => JSX.Element
    = () => {
        const tooltipId = useId('explore');
        const buttonRef = useEventObservedRef<HTMLDivElement, MouseEvent>('click', bottomControlExploreClick$)
        const currentMode = useBehaviorSubjectAsState(controlMode$)
        const mode = MapControlMode.Explore
        const color = CssVariables.controlModeColors(mode)
        return (
            <TooltipHost content="浏览" id={tooltipId} >
                <BottomButton
                    iconName='Nav2DMapView'
                    isActive={currentMode === mode}
                    normalStyle={buttonNormalStyle}
                    hoverStyle={buttonHoverStyle(color)}
                    activeStyle={buttonActiveStyle(color)}
                    ref={buttonRef}
                />
            </TooltipHost>
        )
    }

const MarkingButton: () => JSX.Element
    = () => {
        const tooltipId = useId('marking');
        const buttonRef = useEventObservedRef<HTMLDivElement, MouseEvent>('click', bottomControlMarkingClick$)
        const currentMode = useBehaviorSubjectAsState(controlMode$)
        const mode = MapControlMode.Marking
        const color = CssVariables.controlModeColors(mode)
        return (
            <TooltipHost content="标记" id={tooltipId} >
                <BottomButton
                    iconName='Edit'
                    isActive={currentMode === mode}
                    normalStyle={buttonNormalStyle}
                    hoverStyle={buttonHoverStyle(color)}
                    activeStyle={buttonActiveStyle(color)}
                    ref={buttonRef}
                />
            </TooltipHost>
        )
    }

const UploadButton: () => JSX.Element
    = () => {
        const tooltipId = useId('upload');
        const buttonRef = useEventObservedRef<HTMLDivElement, MouseEvent>('click', bottomControlUploadsClick$)
        const currentMode = useBehaviorSubjectAsState(controlMode$)
        const mode = MapControlMode.Uploads
        const color = CssVariables.controlModeColors(mode)
        return (
            <TooltipHost content="上传" id={tooltipId}>
                <BottomButton
                    iconName='BulkUpload'
                    isActive={currentMode === mode}
                    normalStyle={buttonNormalStyle}
                    hoverStyle={buttonHoverStyle(color)}
                    activeStyle={buttonActiveStyle(color)}
                    ref={buttonRef}
                />
            </TooltipHost>
        )
    }

export const ButtomControl = () => {
    const mode = useBehaviorSubjectAsState(controlMode$)
    const style: CSSProperties = {
        borderBottomColor: CssVariables.controlModeColors(mode)
    }
    return (
        <div id="bottom-control" style={style}>
            <ExploreButton />
            <MarkingButton />
            <UploadButton />
        </div>
    )
}
