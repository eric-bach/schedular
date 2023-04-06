import dayjs, { Dayjs } from 'dayjs';

// Returns the local time part in a span (to - from) of an ISO8601 datetime string
//  Input: 2023-04-06T14:00:00Z, 60
//  Output: 8:00 AM - 9:00 AM
export function formatLocalTimeSpanString(dateString: string, duration: number) {
  return `${formatLocalTimeString(dateString, 0)} - ${formatLocalTimeString(dateString, duration)}`;
}

// Returns the local time part (including offset) of an ISO8601 datetime string
//  Input: 2023-04-06T14:00:00Z, 0
//  Output: 8:00 AM
export function formatLocalTimeString(dateString: string, offsetMinutes: number) {
  const date = new Date(new Date(dateString).getTime() + offsetMinutes * 60000);
  return date.toLocaleTimeString('en-US', {
    timeZone: 'America/Edmonton',
    hour12: true,
    hour: 'numeric',
    minute: 'numeric',
  });
}

// Returns the local date string in format YYYY-MM-DD from an ISO8601 datetime string
//  Input: 2023-04-06T00:00:00Z
//  Output: 2023-04-05
export function formatLocalDateString(date: Dayjs | null) {
  return dayjs(getLocalDateTime(date)).format('YYYY-MM-DD');
}

// Returns the date string in format YYYY-MM-DD from an ISO8601 datetime string
//  Input: 2023-04-06T00:00:00Z
//  Output: 2023-04-05
export function formatDateString(date: Dayjs | null) {
  return dayjs(date).format('YYYY-MM-DD');
}

// Returns the long date string from an ISO8601 datetime string
//  Input: 2023-04-06T00:00:00Z
//  Output: April 6, 2023
export function formatLongDateString(date: Dayjs | null) {
  return dayjs(date).format('MMMM DD, YYYY');
}

// Returns the local ISO8601 datetime string
//  Input: 2023-04-06T14:00:00Z
//  Output: 2023-04-06T08:00:00-06:00
export function getLocalDateTime(date: Dayjs | null) {
  const dateString = date ? date?.toISOString() : new Date();
  return new Date(dateString).toLocaleTimeString('en-US', {
    timeZone: 'America/Edmonton',
    hour12: true,
    hour: 'numeric',
    minute: 'numeric',
  });
}

// Returns the local long date string from an ISO8601 datetime string
//  Input: 2023-04-06T14:00:00Z
//  Output: Thursday, April 6, 2023
export function formateLocalLongDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    timeZone: 'America/Edmonton',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// const addLeadingZeros = (value: string) => {
//   return parseInt(value) < 10 ? `0${value}` : value;
// };
// const calculateEndTime = (startTime: string, duration: number) => {
//   let [hr, min] = startTime.split(':');
//   duration += parseInt(hr) * 60 + parseInt(min);
//   hr = Math.floor(duration / 60).toString();
//   min = (duration % 60).toString();

//   return `${addLeadingZeros(hr)}:${addLeadingZeros(min)}`;
// };
