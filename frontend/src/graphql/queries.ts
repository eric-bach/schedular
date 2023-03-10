export const GET_APPOINTMENTS = `query GetAppointments($date: String!, $lastEvaluatedKey: LastEvaluatedKey) {
  getAvailableAppointments(date: $date, lastEvaluatedKey: $lastEvaluatedKey) {
    pk
    sk
    type
    duration
    status
  }
}`;
