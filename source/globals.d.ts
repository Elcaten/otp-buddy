import {} from 'react/canary';
import {} from 'react-dom/canary';

// https://www.typescriptlang.org/tsconfig/#noUncheckedSideEffectImports
declare module '*.scss' {
  const content: {[className: string]: string};
  export default content;
}
