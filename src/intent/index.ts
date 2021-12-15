import { Subject } from "rxjs";

//#region Subjects
export const documentPointerUp$ = new Subject<PointerEvent>()
export const documentKeyPress$ = new Subject<KeyboardEvent>()
//#endregion
