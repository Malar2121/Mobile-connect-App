import React from 'react';
import { Button } from '../design-system';

/** @deprecated Use Button from design-system directly */
export function PrimaryButton(props) {
  const variantMap = {
    primary: 'primary',
    secondary: 'secondary',
  };
  return (
    <Button
      {...props}
      variant={variantMap[props.variant] ?? props.variant ?? 'primary'}
    />
  );
}
