export function formatTime(timeString: string) {
  return new Date('1970-01-01T' + timeString + 'Z').toLocaleTimeString('en-US', {
    timeZone: 'UTC',
    hour12: true,
    hour: 'numeric',
    minute: 'numeric',
  });
}
