import { IDropdownOption } from "@fluentui/react"
import { FormEvent } from "react"
import { filter, map, Subject } from "rxjs"

export const documentKeyPress$: Subject<KeyboardEvent> = new Subject()

export const bottomControlExploreClick$: Subject<MouseEvent> = new Subject()
export const bottomControlMarkingClick$: Subject<MouseEvent> = new Subject()
export const bottomControlUploadsClick$: Subject<MouseEvent> = new Subject()

export const markingTypeControlSelected$: Subject<[FormEvent<HTMLDivElement>, IDropdownOption?]> = new Subject()

export const markingTypeControlSelectedOption$ = markingTypeControlSelected$.pipe(
    filter(([_, options]) => options !== undefined),
    map(([_, options]) => options!)
)
