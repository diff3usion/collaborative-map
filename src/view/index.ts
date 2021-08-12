import { MapControlMode } from "../model/map/Type"

import './index.css'

const getCssVariable = (varName: string) => getComputedStyle(document.documentElement).getPropertyValue(varName)
export const CssVariables = {
    bottomBorder: getCssVariable('--bottom-border'),
    bottomMargin: getCssVariable('--bottom-margin'),
    bottomControlWidth: getCssVariable('--bottom-control-width'),
    bottomControlHeight: getCssVariable('--bottom-control-height'),
    bottomSubControlHeight: getCssVariable('--bottom-sub-control-height'),
    themeColorExplore: getCssVariable('--theme-color-explore'),
    themeColorMarking: getCssVariable('--theme-color-marking'),
    themeColorUploads: getCssVariable('--theme-color-uploads'),
    controlModeColors: (mode: MapControlMode) => {
        if (mode === MapControlMode.Explore) return CssVariables.themeColorExplore
        if (mode === MapControlMode.Marking) return CssVariables.themeColorMarking
        if (mode === MapControlMode.Uploads) return CssVariables.themeColorUploads
        return '#000000'
    }
}
