import React from 'react';
import { Loader as DSLoader } from '../design-system';

/** @deprecated Use Loader from design-system directly */
export function Loader(props) {
  return <DSLoader {...props} />;
}
