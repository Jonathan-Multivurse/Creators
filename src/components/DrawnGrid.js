import React from 'react';
import HrLine from './HrLine';

const DrawnGrid = ({hour_size, startHour, endHour}) =>
  [...Array(endHour - startHour + 1)].map((val, i) => <HrLine hour_size={hour_size} key={i} />)

export default DrawnGrid;