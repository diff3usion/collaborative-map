import { initializeIcons, TooltipHost, Dropdown, IDropdownOption, DropdownMenuItemType, Icon } from "@fluentui/react"
import { useId } from '@fluentui/react-hooks';
import { CSSProperties, FormEvent, useRef } from "react";
import { BottomSubControl } from "./BottomSubControl";
import { CSSTransition } from 'react-transition-group'
import { CssVariables } from "../";
import { useBehaviorSubjectAsState, useObservedArrayCallback } from "../../utils/hook";
import { markingTypeControlSelected$ } from "../../intent/Control";
import { markingTypeKeyHeader, markingTypeKeyPoint, markingTypeKeyPath, markingTypeKeyRect, markingTypeKeyPolygon, markingTypeKeyEllipse, markingTypeDropdownKeyMap } from "../../Constant";
import { markingMode$ } from "../../store/MapMarking";

const options: IDropdownOption[] = [
    { key: markingTypeKeyHeader, text: '标记类型', itemType: DropdownMenuItemType.Header, data: { color: CssVariables.themeColorMarking } },
    { key: markingTypeKeyPoint, text: '点', data: { icon: 'LocationDot' } },
    { key: markingTypeKeyPath, text: '路径', data: { icon: 'Line' } },
    { key: markingTypeKeyRect, text: '矩形', data: { icon: 'RectangleShape' } },
    { key: markingTypeKeyPolygon, text: '多边形', data: { icon: 'Pentagon' } },
    { key: markingTypeKeyEllipse, text: '椭圆', data: { icon: 'Ellipse' } },
];

const onRenderTitle = (options?: IDropdownOption[]): JSX.Element => {
    if (!options) return <div />
    const option = options[0];
    return (
        <div>
            {option.data && option.data.icon && (
                <Icon style={iconStyles} iconName={option.data.icon} aria-hidden="true" title={option.data.icon} />
            )}
        </div>
    );
};

const iconStyles = { marginRight: '8px' };
const onRenderOption = (option?: IDropdownOption): JSX.Element => {
    if (!option) return <div />
    return (
        <div style={{ color: option.data.color }}>
            {option.data && option.data.icon && (
                <Icon style={iconStyles} iconName={option.data.icon} aria-hidden="true" title={option.data.icon} />
            )}
            <span>{option.text}</span>
        </div>
    );
};

type MarkingTypeControlProps = {
    display: boolean
    style?: CSSProperties
}

const markingTypeControlPadding = 12
const markingTypeDropdownWidth = 48
export const markingTypeControlWidth = markingTypeControlPadding * 2 + markingTypeDropdownWidth

export const MarkingTypeControl: (props: MarkingTypeControlProps) => JSX.Element
    = props => {
        const ref = useRef(null)
        const tooltipId = useId('marking_type');
        const style: CSSProperties = { ...props.style, paddingLeft: markingTypeControlPadding, paddingRight: markingTypeControlPadding }
        const onChange = useObservedArrayCallback(markingTypeControlSelected$)
        const markingMode = useBehaviorSubjectAsState(markingMode$)
        return (
            <CSSTransition
                nodeRef={ref}
                in={props.display}
                timeout={200}
                classNames="bottom-sub-control"
                unmountOnExit>
                <BottomSubControl ref={ref} style={style}>
                    <TooltipHost content="标记类型" id={tooltipId}>
                        <Dropdown
                            style={{ width: markingTypeDropdownWidth }}
                            dropdownWidth={96}
                            onRenderTitle={onRenderTitle}
                            onRenderOption={onRenderOption}
                            onRenderCaretDown={() => (<Icon style={{ fontSize: 12 }} iconName='ChevronUp' />)}
                            options={options}
                            onChange={onChange}
                            selectedKey={markingTypeDropdownKeyMap.reverseGet(markingMode)}
                        />
                    </TooltipHost>
                </BottomSubControl>
            </CSSTransition>
        )
    }
