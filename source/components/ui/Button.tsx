import {ButtonHTMLAttributes} from 'react';
import styles from './Button.module.css';
import clsx from 'clsx';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  size?: 'icon' | 'default';
  className?: string;
};

export function Button({children, className, size = 'default', ...props}: ButtonProps) {
  const buttonClassName = clsx(styles.button, className, {
    [styles.buttonIcon]: size === 'icon',
  });
  return (
    <button type="button" className={buttonClassName} {...props}>
      {children}
    </button>
  );
}
