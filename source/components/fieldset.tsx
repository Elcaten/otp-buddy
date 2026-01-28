import * as Headless from '@headlessui/react';
import clsx from 'clsx';
import type React from 'react';
import {JSX} from 'react';

type FieldsetProps = {className?: string} & Omit<
  Headless.FieldsetProps,
  'as' | 'className'
>;

export function Fieldset(props: FieldsetProps): JSX.Element {
  const {className, ...rest} = props;
  return (
    <Headless.Fieldset
      {...rest}
      className={clsx(
        className,
        '*:data-[slot=text]:mt-1 [&>*+[data-slot=control]]:mt-6'
      )}
    />
  );
}

// ---

type LegendProps = {className?: string} & Omit<
  Headless.LegendProps,
  'as' | 'className'
>;

export function Legend(props: LegendProps): JSX.Element {
  const {className, ...rest} = props;
  return (
    <Headless.Legend
      data-slot="legend"
      {...rest}
      className={clsx(
        className,
        'text-base/6 font-semibold text-zinc-950 data-disabled:opacity-50 sm:text-sm/6 dark:text-white'
      )}
    />
  );
}

// ---

type FieldGroupProps = React.ComponentPropsWithoutRef<'div'>;

export function FieldGroup(props: FieldGroupProps): JSX.Element {
  const {className, ...rest} = props;
  return (
    <div
      data-slot="control"
      {...rest}
      className={clsx(className, 'space-y-8')}
    />
  );
}

// ---

type FieldProps = {className?: string} & Omit<
  Headless.FieldProps,
  'as' | 'className'
>;

export function Field(props: FieldProps): JSX.Element {
  const {className, ...rest} = props;
  return (
    <Headless.Field
      {...rest}
      className={clsx(
        className,
        '[&>[data-slot=label]+[data-slot=control]]:mt-3',
        '[&>[data-slot=label]+[data-slot=description]]:mt-1',
        '[&>[data-slot=description]+[data-slot=control]]:mt-3',
        '[&>[data-slot=control]+[data-slot=description]]:mt-3',
        '[&>[data-slot=control]+[data-slot=error]]:mt-3',
        '*:data-[slot=label]:font-medium'
      )}
    />
  );
}

// ---

type LabelProps = {className?: string} & Omit<
  Headless.LabelProps,
  'as' | 'className'
>;

export function Label(props: LabelProps): JSX.Element {
  const {className, ...rest} = props;
  return (
    <Headless.Label
      data-slot="label"
      {...rest}
      className={clsx(
        className,
        'text-base/6 text-zinc-950 select-none data-disabled:opacity-50 sm:text-sm/6 dark:text-white'
      )}
    />
  );
}

// ---

type DescriptionProps = {className?: string} & Omit<
  Headless.DescriptionProps,
  'as' | 'className'
>;

export function Description(props: DescriptionProps): JSX.Element {
  const {className, ...rest} = props;
  return (
    <Headless.Description
      data-slot="description"
      {...rest}
      className={clsx(
        className,
        'text-base/6 text-zinc-500 data-disabled:opacity-50 sm:text-sm/6 dark:text-zinc-400'
      )}
    />
  );
}

// ---

type ErrorMessageProps = {className?: string} & Omit<
  Headless.DescriptionProps,
  'as' | 'className'
>;

export function ErrorMessage(props: ErrorMessageProps): JSX.Element {
  const {className, ...rest} = props;
  return (
    <Headless.Description
      data-slot="error"
      {...rest}
      className={clsx(
        className,
        'text-base/6 text-red-600 data-disabled:opacity-50 sm:text-sm/6 dark:text-red-500'
      )}
    />
  );
}
