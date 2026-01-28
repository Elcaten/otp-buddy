import clsx from 'clsx';
import type React from 'react';
import type {JSX} from 'react';

type HeadingProps = {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
} & React.ComponentPropsWithoutRef<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'>;

export function Heading(props: HeadingProps): JSX.Element {
  const {className, level = 1, ...rest} = props;
  const Element: `h${typeof level}` = `h${level}`;

  return (
    <Element
      {...rest}
      className={clsx(
        className,
        'text-2xl/8 font-semibold text-zinc-950 sm:text-xl/8 dark:text-white'
      )}
    />
  );
}

type SubheadingProps = {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
} & React.ComponentPropsWithoutRef<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'>;

export function Subheading(props: SubheadingProps): JSX.Element {
  const {className, level = 2, ...rest} = props;
  const Element: `h${typeof level}` = `h${level}`;

  return (
    <Element
      {...rest}
      className={clsx(
        className,
        'text-base/7 font-semibold text-zinc-950 sm:text-sm/6 dark:text-white'
      )}
    />
  );
}
