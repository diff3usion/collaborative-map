
import { IconButton, Modal } from "@fluentui/react"
import { ReactNode, useCallback } from "react"
import "./FloatingWindow.css"
import { Property } from "csstype"
import { PlaneVector } from "../../../Type"

type FloatingWindowProps = {
    children: ReactNode
    className: string
    translate: PlaneVector
    title: string,
    themeColor: Property.Color
}

export const FloatingWindow = (props: FloatingWindowProps) => {
    const inited = useCallback(() => {
        const selected = document.getElementsByClassName(props.className)[0].children[0] as HTMLElement
        selected.classList.add("transitioned")
    }, [])

    return (
        <Modal
            className={props.className}
            isOpen={true}
            isModeless={true}
        >
            <div className='floating-window-content' ref={inited}>
                <div
                    className='floating-window-title'
                    // onPointerOut={mapToAndObserveWith(false, titlePointerIsDown$)}
                    style={{
                        color: props.themeColor,
                        borderTopColor: props.themeColor,
                        userSelect: "none",
                    }}>
                    <span>{props.title}</span>
                    <IconButton
                        className='floating-window-close'
                        styles={{ root: { color: props.themeColor } }}
                        iconProps={{ iconName: 'Cancel' }}
                        onClick={e => console.log("here" + e.stopPropagation())}
                        onPointerDown={e => e.stopPropagation()}
                    />
                </div>
                {props.children}
            </div>
        </Modal>
    )
}
