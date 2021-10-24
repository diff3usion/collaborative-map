export type SnakeToCamelCase<S extends string> = S extends `${infer T}_${infer U}`
    ? `${T}${Capitalize<SnakeToCamelCase<U>>}`
    : S
export type CamelToSnakeCase<S extends string> = S extends `${infer T}${infer U}`
    ? `${T extends Capitalize<T> ? "_" : ""}${Lowercase<T>}${CamelToSnakeCase<U>}`
    : S
export type PickWithPrefix<Prefix extends string, T, K extends keyof T> = {
    [P in K & string as `${Prefix}${Capitalize<P>}`]: T[P]
}
export type PickWithSuffix<Suffix extends string, T, K extends keyof T> = {
    [P in K & string as `${P}${Capitalize<Suffix>}`]: T[P]
}
export type PickAndRename<T, K extends Record<keyof T, string>> = {
    [P in keyof K as K[P]]: P extends keyof T ? T[P] : never
}
export type RenameWithPrefix<Prefix extends string, T, K extends keyof T> = Omit<T, K> & PickWithPrefix<Prefix, T, K>
export type RenameWithSuffix<Suffix extends string, T, K extends keyof T> = Omit<T, K> & PickWithSuffix<Suffix, T, K>
export type Rename<T, K extends Record<keyof T, string>> = Omit<T, keyof K> & PickAndRename<T, K>
export type WithPrefix<Prefix extends string, T> = PickWithPrefix<Prefix, T, keyof T>
export type WithSuffix<Suffix extends string, T> = PickWithSuffix<Suffix, T, keyof T>

export type Overwrite<T, F> = Omit<T, keyof F> & F
export type EnumRecord<E> = Record<keyof E, E[keyof E]>
export type KeyofWithType<T, U> = {
    [P in keyof T]: T[P] extends U ? P : never
}[keyof T]
