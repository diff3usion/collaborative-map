import "./BottomSubControl.css"

import { CSSProperties, forwardRef, ReactNode } from "react";
import { useBehaviorSubjectAsState } from "../../../utils/hook";
import { CssVariables } from "../../";
import { MapControlMode } from "../../../model/Type";
import { controlMode$ } from "../../../store/MapControl";

export type BottomSubControlProps = {
    children: ReactNode
    style?: CSSProperties
}

export const BottomSubControl = forwardRef<HTMLDivElement, BottomSubControlProps>((props: BottomSubControlProps, ref) => {
        const currentMode = useBehaviorSubjectAsState(controlMode$)
        const style = { ...props.style, borderBottomColor: CssVariables.controlModeColors(currentMode) }
        return <div
            ref={ref}
            className="bottom-sub-control"
            style={style}
            children={props.children}
        />
    })
