
import { ContextualMenu, FontWeights, IconButton, IModal, Modal } from "@fluentui/react"
import { ReactNode, useRef, useState } from "react"
import "./FloatingWindow.css"
import { Property } from "csstype"

type FloatingWindowProps = {
    children: ReactNode
    title: string,
    themeColor: Property.Color
}
export const FloatingWindow = (props: FloatingWindowProps) => {
    return (
        <Modal
            className='floating-window'
            isOpen={true}
            isModeless={true}
            dragOptions={{
                dragHandleSelector: '.floating-window-title',
                moveMenuItemText: 'Move',
                closeMenuItemText: 'Close',
                menu: ContextualMenu,
                keepInBounds: true,
            }}
        >
            <div className='floating-window-title' style={{color: props.themeColor, borderTopColor: props.themeColor}}>
                <span>{props.title}</span>
                <IconButton
                    className='floating-window-close'
                    styles={{ root: { color: props.themeColor } }}
                    iconProps={{ iconName: 'Cancel' }}
                />
            </div>
            {props.children}
        </Modal>
    )
}
