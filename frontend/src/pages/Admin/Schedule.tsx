import React, { useEffect } from 'react';
import { Loader, useAuthenticator } from '@aws-amplify/ui-react';
import { API, graphqlOperation } from 'aws-amplify';
import { GraphQLQuery } from '@aws-amplify/api';
import { Button, Container, Chip, TextField, Typography, Alert } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import Grid from '@mui/material/Unstable_Grid2';
import dayjs, { Dayjs } from 'dayjs';
import isBetweenPlugin from 'dayjs/plugin/isBetween';
import { ErrorMessage, Field, FieldArray, Form, Formik, getIn } from 'formik';
import * as yup from 'yup';
import { v4 as uuidv4 } from 'uuid';

import { GET_APPOINTMENTS } from '../../graphql/queries';
import { GetAppointmentsResponse, AppointmentItem } from '../../types/BookingTypes';
import { formatLongDateString } from '../../helpers/utils';

dayjs.extend(isBetweenPlugin);

type InputValues = {
  pk: string;
  sk: Dayjs;
  status: string;
  type: string;
  category: string;
  duration: number;
};

function convertToInputValues(items: AppointmentItem[] | undefined): InputValues[] {
  if (!items) return [];

  return items.map((item) => {
    return {
      pk: item.pk,
      sk: dayjs(item.sk),
      status: item.status,
      type: item.type,
      category: item.category,
      duration: item.duration,
    };
  });
}

function Schedule() {
  const { authStatus } = useAuthenticator((context) => [context.route]);

  const [date, setDate] = React.useState<Dayjs | null>(dayjs());
  const [isLoading, setLoading] = React.useState<boolean>(false);
  const [appointments, setAppointments] = React.useState<InputValues[]>([]);

  const getAppointments = async (from: Dayjs, to: Dayjs) => {
    console.debug(`[SCHEDULE] Getting schedule from ${from} to ${to}`);

    setLoading(true);

    const result = await API.graphql<GraphQLQuery<GetAppointmentsResponse>>(graphqlOperation(GET_APPOINTMENTS, { from, to }));
    setAppointments(convertToInputValues(result.data?.getAppointments?.items) ?? []);

    setLoading(false);

    return result.data?.getAppointments?.items;
  };

  async function dateSelected(d: Dayjs) {
    console.log('[SCHEDULE] Date selected', d);
    setDate(d);

    const result = await getAppointments(d, d.add(1, 'day'));
    console.debug('[SCHEDULE] Found appointments', result);
  }

  useEffect(() => {
    if (authStatus === 'authenticated') {
      getAppointments(dayjs(), dayjs().add(1, 'day')).then((result) => {
        console.debug('[SCHEDULE] Loaded initial appointments', result);
      });
    } else {
      // TODO Return error
    }
  }, []);

  function addField(values: InputValues[]) {
    const appt = {
      // TODO Temporarily set GUID so key is unique in map
      pk: `appt#${uuidv4()}`,
      sk: dayjs().hour(0).minute(0).second(0).millisecond(0),
      type: 'appt',
      category: 'massage',
      duration: 60,
      status: 'new',
    };

    values.push(appt);
    console.log('ADDED APPOINTMENT', values);

    setAppointments([...appointments, appt]);
    console.log('ADDED APPOINTMENT', [...appointments, appt]);
  }

  function removeField(values: InputValues[], index: number) {
    values[index].status = 'pending*';
    appointments[index].status = 'pending*';
    // Remove from state
    // values.pop();
    setAppointments([...appointments]);

    console.log('REMOVED APPOINTMENT', appointments);
  }

  const schema = yup.object({
    appointments: yup.array().of(
      yup.object().shape({
        // TODO Remove for testing
        sk: yup.date().required('Required').min(dayjs().set('hour', 2), 'Invalid'),
        duration: yup.number().required('Required').moreThan(0, 'Invalid'),
      })
    ),
  });

  return (
    <Container maxWidth='lg' sx={{ mt: 5 }}>
      <Grid container spacing={{ md: 1, lg: 1 }} columns={{ md: 6, lg: 6 }}>
        <Grid md={2} lg={2}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateCalendar value={date} minDate={dayjs()} maxDate={dayjs().add(1, 'year')} onChange={(newDate) => dateSelected(newDate ?? dayjs())} />
          </LocalizationProvider>
        </Grid>

        <Grid md={4} lg={4}>
          {isLoading ? (
            <Loader variation='linear' />
          ) : (
            <React.Fragment>
              <Typography variant='h5' fontWeight='bold' align='left' color='textPrimary' gutterBottom sx={{ mt: 2 }}>
                Schedule for {formatLongDateString(date)}
              </Typography>

              <Formik
                initialValues={{ appointments: appointments }}
                validationSchema={schema}
                onSubmit={(values) => {
                  console.log('[SCHEDULE] VALIDATION PASSED! SAVING VALUES', values);
                }}
              >
                {({ values, errors, touched, handleChange, handleBlur }) => (
                  <Form>
                    <FieldArray name='appointments'>
                      {({ insert, remove, push }) => (
                        <React.Fragment>
                          {values.appointments.length > 0 &&
                            values.appointments.map((appt, index) => (
                              <React.Fragment key={index}>
                                <Grid container spacing={{ xs: 1 }} columns={{ xs: 12 }}>
                                  <Grid xs={2}>
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                      {/* <TimePicker
                                        label='Start Time'
                                        value={values.appointments[index].sk}
                                        disabled={values.appointments[index].status === 'booked'}
                                        onChange={(value) => (values.appointments[index].sk = value ?? new Dayjs())}
                                      />
                                      <ErrorMessage name={`appointments.${index}.sk`} component='div' className='field-error' /> */}
                                      <Field
                                        component={TimePicker}
                                        name={`appointments.${index}.sk`}
                                        value={values.appointments[index].sk}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={Boolean(getIn(errors, `appointments[${index}].sk`)) && getIn(touched, `appointments[${index}].sk`)}
                                        helperText={getIn(errors, `appointments[${index}].sk`)}
                                      />
                                      {/* <ErrorMessage name={`appointments.${index}.sk`} component='div' className='field-error' /> */}
                                    </LocalizationProvider>
                                  </Grid>

                                  <Grid xs={2}>
                                    <Field
                                      as={TextField}
                                      name={`appointments.${index}.duration`}
                                      value={values.appointments[index].duration}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      error={getIn(errors, `appointments[${index}].duration`) && getIn(touched, `appointments[${index}].duration`)}
                                      helperText={getIn(errors, `appointments[${index}].duration`)}
                                    />
                                  </Grid>

                                  <Grid xs={2}>
                                    {values.appointments[index].status && (
                                      <Chip
                                        label={values.appointments[index].status}
                                        color={values.appointments[index].status === 'available' ? 'success' : 'primary'}
                                        variant={values.appointments[index].status === 'cancelled' ? 'outlined' : 'filled'}
                                        sx={{ mb: 1, mt: 1.5 }}
                                      />
                                    )}
                                  </Grid>

                                  <Grid xs={2}>
                                    <Button color='error' variant='contained' onClick={() => removeField(values.appointments, index)} sx={{ m: 1 }}>
                                      X
                                    </Button>
                                  </Grid>
                                </Grid>
                              </React.Fragment>
                            ))}
                          <Button variant='contained' color='success' type='button' onClick={() => addField(values.appointments)} sx={{ m: 1 }}>
                            Add
                          </Button>
                        </React.Fragment>
                      )}
                    </FieldArray>
                    <Button type='submit' variant='contained' color='primary' sx={{ m: 1 }}>
                      Save
                    </Button>
                  </Form>
                )}
              </Formik>
            </React.Fragment>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}

export default Schedule;
