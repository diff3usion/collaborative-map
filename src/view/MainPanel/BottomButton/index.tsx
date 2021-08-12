import { FontIcon } from "@fluentui/react"
import { forwardRef, useState, CSSProperties } from "react"
import { Property } from "csstype"

import "./BottomButton.css"

export type BottomButtonStyle = {
    width: number
    height: number
    iconSizeRatio?: number
    color?: Property.Color
    background?: Property.Color
}
export type BottomButtonProps = {
    iconName: string
    isActive: boolean
    normalStyle: BottomButtonStyle
    hoverStyle?: BottomButtonStyle
    activeStyle?: BottomButtonStyle
}
export const BottomButton
    = forwardRef<HTMLDivElement, BottomButtonProps>(({ iconName, isActive, normalStyle, hoverStyle, activeStyle }, ref) => {
        const [isHover, setHover] = useState(false)
        const { width, height, iconSizeRatio, color, background } = isActive && activeStyle ? activeStyle : isHover && hoverStyle ? hoverStyle : normalStyle
        const iconSize = Math.min(width, height) * (iconSizeRatio ? iconSizeRatio : 0.6)
        const iconFontSize = iconSize * 0.8
        const buttonStyle: CSSProperties = {
            width,
            height,
            color: color,
            background: background,
            alignItems: "center"
        }
        const iconStyle: CSSProperties = {
            fontSize: iconFontSize,
            height: iconSize,
            width: iconSize,
        }
        return (
            <div ref={ref} className="bottom-button" style={buttonStyle} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                <FontIcon iconName={iconName} className="bottom-button-icon" style={iconStyle} />
            </div>
        )
    })
