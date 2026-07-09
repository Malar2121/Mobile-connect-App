import React from 'react';
import { Card as DSCard } from '../design-system';

/** @deprecated Use Card from design-system directly */
export function Card(props) {
  return <DSCard {...props} />;
}
