import clsx from 'clsx';
import {Link} from './link';

type TextProps = {className?: string} & Omit<
  React.ComponentPropsWithoutRef<'p'>,
  'className'
>;
export function Text(props: TextProps): React.ReactElement {
  const {className, ...rest} = props;
  return (
    <p
      data-slot="text"
      {...rest}
      className={clsx(
        className,
        'text-base/6 text-zinc-500 sm:text-sm/6 dark:text-zinc-400'
      )}
    />
  );
}

type TextLinkProps = {className?: string} & Omit<
  React.ComponentPropsWithoutRef<typeof Link>,
  'className'
>;
export function TextLink(props: TextLinkProps): React.ReactElement {
  const {className, ...rest} = props;
  return (
    <Link
      {...rest}
      className={clsx(
        className,
        'text-zinc-950 underline decoration-zinc-950/50 data-hover:decoration-zinc-950 dark:text-white dark:decoration-white/50 dark:data-hover:decoration-white'
      )}
    />
  );
}

type StrongProps = {className?: string} & Omit<
  React.ComponentPropsWithoutRef<'strong'>,
  'className'
>;
export function Strong(props: StrongProps): React.ReactElement {
  const {className, ...rest} = props;
  return (
    <strong
      {...rest}
      className={clsx(className, 'font-medium text-zinc-950 dark:text-white')}
    />
  );
}

type CodeProps = {className?: string} & Omit<
  React.ComponentPropsWithoutRef<'code'>,
  'className'
>;
export function Code(props: CodeProps): React.ReactElement {
  const {className, ...rest} = props;
  return (
    <code
      {...rest}
      className={clsx(
        className,
        'rounded-sm border border-zinc-950/10 bg-zinc-950/2.5 px-0.5 text-sm font-medium text-zinc-950 sm:text-[0.8125rem] dark:border-white/20 dark:bg-white/5 dark:text-white'
      )}
    />
  );
}
