import React from 'react';
import ComparisonTemplate from './ComparisonTemplate';
import comparisonData from './comparisonData';

const VsGusto = () => (
  <ComparisonTemplate competitor="gusto" data={comparisonData.gusto} />
);

export default VsGusto;
