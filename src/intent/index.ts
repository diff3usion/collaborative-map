import { Subject } from "rxjs";

export const documentPointerUp$ = new Subject<PointerEvent>()

export const documentKeyPress$ = new Subject<KeyboardEvent>()
