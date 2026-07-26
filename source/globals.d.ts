// https://www.typescriptlang.org/tsconfig/#noUncheckedSideEffectImports
declare module '*.scss' {
  const content: {[className: string]: string};
  export default content;
}

declare const __DEV__: boolean;
