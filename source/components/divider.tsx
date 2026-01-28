import clsx from 'clsx';
import type React from 'react';
import type {JSX} from 'react';

type DividerProps = {soft?: boolean} & React.ComponentPropsWithoutRef<'hr'>;

export function Divider(props: DividerProps): JSX.Element {
  const {soft = false, className, ...rest} = props;
  return (
    <hr
      role="presentation"
      {...rest}
      className={clsx(
        className,
        'w-full border-t',
        soft && 'border-zinc-950/5 dark:border-white/5',
        !soft && 'border-zinc-950/10 dark:border-white/10'
      )}
    />
  );
}
