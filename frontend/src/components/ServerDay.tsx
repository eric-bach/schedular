import { Badge } from '@mui/material';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers';
import { Dayjs } from 'dayjs';

export type HighlightedDay = {
  day: number;
  count: number;
};

export default function ServerDay(props: PickersDayProps<Dayjs> & { highlightedDays?: HighlightedDay[] }) {
  const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;

  const isSelected = !props.outsideCurrentMonth && highlightedDays.findIndex((x) => x.day === props.day.date()) > 0;
  const value = highlightedDays.filter((x) => x.day === props.day.date());

  // Display purple badge if low availability
  let badge = undefined;
  if (isSelected && value[0].count <= 1) {
    badge = '🟣';
  } else if (isSelected) {
    badge = '🔵';
  }

  return (
    <Badge key={props.day.toString()} overlap='circular' badgeContent={badge}>
      <PickersDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />
    </Badge>
  );
}
