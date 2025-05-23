import React, { useEffect } from 'react';
import { Loader, useAuthenticator } from '@aws-amplify/ui-react';
import { API, graphqlOperation } from 'aws-amplify';
import { GraphQLQuery } from '@aws-amplify/api';
import { Button, Container, Chip, TextField, Typography, Alert, IconButton } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import Grid from '@mui/material/Unstable_Grid2';
import { AddCircle as AddCircleIcon, Cancel as CancelIcon } from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import isBetweenPlugin from 'dayjs/plugin/isBetween';
import { ErrorMessage, Field, FieldArray, Form, Formik, getIn } from 'formik';
import * as yup from 'yup';
import { v4 as uuidv4 } from 'uuid';

import { GET_APPOINTMENTS, UPSERT_DELETE_APPOINTMENTS } from '../../graphql/queries';
import { GetAppointmentsResponse, AppointmentItem, UpsertDeleteAppointmentsResponse } from '../../types/Types';
import { formatLongDateString } from '../../helpers/utils';

dayjs.extend(isBetweenPlugin);

type InputValues = {
  pk: string;
  sk: Dayjs;
  status: string;
  type: string;
  category: string;
  duration: number;
  administratorDetails: {
    id: string;
    firstName: string;
    lastName: string;
  };
};

function convertToInputValues(userAttributes: any, items: AppointmentItem[] | undefined): InputValues[] {
  if (!items) return [];

  return items.map((item) => {
    return {
      pk: item.pk,
      sk: dayjs(item.sk),
      status: item.status,
      type: item.type,
      category: item.category,
      duration: item.duration,
      administratorDetails: {
        id: userAttributes.sub,
        firstName: userAttributes.given_name,
        lastName: userAttributes.family_name,
      },
    };
  });
}

function ManageSchedule() {
  const { user, authStatus } = useAuthenticator((context) => [context.route]);

  const [error, setError] = React.useState<string>();
  const [date, setDate] = React.useState<Dayjs | null>(dayjs());
  const [isLoading, setLoading] = React.useState<boolean>(false);
  const [appointments, setAppointments] = React.useState<InputValues[]>([]);

  const getAppointments = async (from: Dayjs, to: Dayjs) => {
    //console.debug(`[MANAGE SCHEDULE] Getting schedule from ${from} to ${to}`);

    setLoading(true);

    const result = await API.graphql<GraphQLQuery<GetAppointmentsResponse>>(graphqlOperation(GET_APPOINTMENTS, { from, to }));
    setAppointments(convertToInputValues(user.attributes!, result.data?.getAppointments?.items) ?? []);

    setLoading(false);

    return result.data?.getAppointments?.items;
  };

  async function dateSelected(d: Dayjs) {
    setDate(d);
    setError(undefined);

    await getAppointments(d.hour(0).minute(0).second(0), d.hour(0).minute(0).second(0).add(1, 'day'));
    //console.debug('[MANAGE SCHEDULE] Found appointments', result);
  }

  useEffect(() => {
    if (authStatus === 'authenticated') {
      getAppointments(dayjs().hour(0).minute(0).second(0), dayjs().hour(0).minute(0).second(0).add(1, 'day')).then((result) => {
        //console.debug('[MANAGE SCHEDULE] Loaded initial appointments', result);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addField(values: InputValues[]) {
    const appt: InputValues = {
      pk: `appt#${uuidv4()}`,
      sk: dayjs(date).hour(0).minute(0).second(0).millisecond(0),
      status: 'available*',
      type: 'appt',
      category: 'massage',
      duration: 60,
      administratorDetails: {
        id: user.attributes?.sub!,
        firstName: user.attributes?.given_name!,
        lastName: user.attributes?.family_name!,
      },
    };
    values.push(appt);

    setAppointments([...appointments, appt]);
    //console.debug('[MANAGE SCHEDULE] Added appointment', values);
  }

  function removeField(values: InputValues[], index: number) {
    // Remove from state
    if (values[index].status === 'available*') {
      values.splice(index, 1);
      appointments.splice(index, 1);
    } else {
      values[index].status = 'pending*';
      appointments[index].status = 'pending*';
    }

    setAppointments([...appointments]);
    // console.log('[MANAGE SCHEDULE] Removed appointment', values);
  }

  function validSchedule(values: InputValues[]) {
    // Sort by sk
    values.sort(function (a: InputValues, b: InputValues) {
      if (a.sk < b.sk) return -1;
      if (a.sk > b.sk) return 1;
      return 0;
    });

    // Get start and end times
    const times: Dayjs[] = [];
    const startTimes: Dayjs[] = values.map((v) => v.sk);
    const durations: number[] = values.map((v) => v.duration);
    for (let i = 0; i < startTimes.length; i++) {
      times.push(startTimes[i]);
      times.push(dayjs(startTimes[i]).add(durations[i], 'minute'));
    }

    // Check for overlaps
    let isValid = true;
    setError(undefined);
    for (let j = 0; j < times.length - 1; j++) {
      if (times[j] > times[j + 1]) {
        isValid = false;
        setError('The schedule has overlapping time slots. Please correct before proceeding.');
        break;
      }
    }

    return isValid;
  }

  async function handleSubmit(values: InputValues[]) {
    if (validSchedule(values)) {
      values = values.map((p) => (p.status === 'available*' ? { ...p, status: 'available' } : p));

      await API.graphql<GraphQLQuery<UpsertDeleteAppointmentsResponse>>(graphqlOperation(UPSERT_DELETE_APPOINTMENTS, { input: { appointments: values } }));
      //console.log('[MANAGE SCHEDULE] UpsertDelete Response:', result);

      dateSelected(date ?? dayjs());
    }
  }

  const schema = yup.object({
    appointments: yup.array().of(
      yup.object().shape({
        sk: yup.date().required('Required'),
        duration: yup.number().required('Required').moreThan(0, 'Invalid'),
      })
    ),
  });

  const InvalidTimeComponent = () => {
    return <Typography sx={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '3px', marginLeft: '14px' }}>Invalid Time</Typography>;
  };

  return (
    <Container maxWidth='lg' sx={{ mt: 5 }}>
      <Grid container justifyContent='center' columns={12}>
        <Grid xs={12} lg={4}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateCalendar value={date} minDate={dayjs()} maxDate={dayjs().add(1, 'year')} onChange={(newDate) => dateSelected(newDate ?? dayjs())} />
          </LocalizationProvider>
        </Grid>

        <Grid xs={10} lg={6}>
          {isLoading && <Loader variation='linear' filledColor='#1976d2' />}
          {!isLoading && (
            <React.Fragment>
              <Typography variant='h5' fontWeight='bold' align='left' color='textPrimary' gutterBottom sx={{ mt: 1 }}>
                Schedule for {formatLongDateString(date)}
              </Typography>

              <Formik
                initialValues={{ appointments: appointments }}
                validationSchema={schema}
                onSubmit={(values) => {
                  handleSubmit(values.appointments);
                }}
              >
                {({ values, errors, touched, handleChange, handleBlur }) => (
                  <Form>
                    {getIn(errors, `appointments`) && (
                      <Alert color='error' sx={{ mb: 2 }}>
                        There are some invalid values in the schedule. Please correct them before proceeding.
                      </Alert>
                    )}
                    {error && (
                      <Alert color='error' sx={{ mb: 2 }}>
                        {error}
                      </Alert>
                    )}

                    <FieldArray name='appointments'>
                      {({ insert, remove, push }) => (
                        <React.Fragment>
                          {values.appointments.length === 0 && <Typography>No scheduled appointments today. Click below to create one.</Typography>}
                          {values.appointments.length > 0 &&
                            values.appointments.map((appt, index) => (
                              <React.Fragment key={appt.pk}>
                                <Grid container spacing={0.5} columns={12}>
                                  <Grid xs={4} lg={3}>
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
                                        type='time'
                                        name={`appointments.${index}.sk`}
                                        value={values.appointments[index].sk}
                                        onChange={(value: any) => {
                                          values.appointments[index].sk = value;
                                        }}
                                        onBlur={handleBlur}
                                        error={getIn(errors, `appointments.${index}.sk`) && getIn(touched, `appointments.${index}.sk`)}
                                        helperText={getIn(errors, `appointments.${index}.sk`)}
                                      />
                                      {/* TODO Field error/helperText does not work so using ErrorMessage with a custom styled component */}
                                      <ErrorMessage name={`appointments.${index}.sk`} component={InvalidTimeComponent} className='field-error' />
                                    </LocalizationProvider>
                                  </Grid>

                                  <Grid xs={2} lg={2}>
                                    <Field
                                      as={TextField}
                                      name={`appointments.${index}.duration`}
                                      value={values.appointments[index].duration}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      error={getIn(errors, `appointments.${index}.duration`) && getIn(touched, `appointments.${index}.duration`)}
                                      helperText={getIn(errors, `appointments.${index}.duration`)}
                                    />
                                  </Grid>

                                  <Grid xs={4} lg={2}>
                                    {values.appointments[index].status && (
                                      <Chip
                                        label={values.appointments[index].status}
                                        color={values.appointments[index].status === 'available' ? 'success' : 'primary'}
                                        variant={values.appointments[index].status === 'cancelled' ? 'outlined' : 'filled'}
                                        sx={{ mb: 1, mt: 1.5 }}
                                      />
                                    )}
                                  </Grid>

                                  <Grid xs={2} lg={1}>
                                    {values.appointments[index].status !== 'booked' && (
                                      <IconButton aria-label='remove ' onClick={() => removeField(values.appointments, index)}>
                                        <CancelIcon color='error' sx={{ m: 1 }} />
                                      </IconButton>
                                    )}
                                  </Grid>
                                </Grid>
                              </React.Fragment>
                            ))}
                        </React.Fragment>
                      )}
                    </FieldArray>

                    <IconButton aria-label='add' onClick={() => addField(values.appointments)}>
                      <AddCircleIcon color='success' sx={{ mt: 1.5 }} />
                    </IconButton>
                    <Button type='submit' variant='contained' color='primary' sx={{ mt: 1.5, ml: 0.5 }}>
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

export default ManageSchedule;
