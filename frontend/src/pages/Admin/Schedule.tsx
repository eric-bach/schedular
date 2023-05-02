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
import { useFormik, ErrorMessage } from 'formik';
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

    const result = await API.graphql<GraphQLQuery<GetAppointmentsResponse>>(
      graphqlOperation(GET_APPOINTMENTS, { from, to })
    );
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

  const initialValues: InputValues[] = [];
  useEffect(() => {
    if (authStatus === 'authenticated') {
      getAppointments(dayjs(), dayjs().add(1, 'day')).then((result) => {
        console.debug('[SCHEDULE] Loaded initial appointments', result);

        result?.map((r) => {
          const v = {
            pk: r.pk,
            sk: dayjs(r.sk),
            status: r.status,
            type: r.type,
            category: r.category,
            duration: r.duration,
          };

          initialValues.push(v);
        });
      });
    } else {
      // TODO Return error
    }
  }, []);

  function addField() {
    const appt = {
      // TODO Temporarily set GUID so key is unique in map
      pk: `appt#${uuidv4()}`,
      sk: dayjs().hour(0).minute(0).second(0).millisecond(0),
      type: 'appt',
      category: 'massage',
      duration: 0,
      status: 'new',
    };

    formik.values.appointments.push(appt);
    setAppointments([...appointments, appt]);

    console.log('ADDED APPOINTMENT', formik.values.appointments);
  }

  function removeField(index: number) {
    formik.values.appointments[index].status = 'pending*';
    appointments[index].status = 'pending*';
    // Remove from state
    // values.pop();
    setAppointments([...appointments]);

    console.log('REMOVED APPOINTMENT', appointments);
  }

  const handleSubmit = () => {
    console.log('Submit');
  };

  const formik = useFormik({
    initialValues: {
      appointments: initialValues,
    },
    validationSchema: yup.object({
      appointments: yup.array().of(
        yup.object().shape({
          sk: yup.date().required('Please enter a start time').min(dayjs().set('hour', 2)),
          duration: yup.number().required('Please enter a duration').moreThan(0),
        })
      ),
    }),
    onSubmit: (values) => {
      console.log('values', values);
      console.log('errors', formik.errors);
      handleSubmit();
    },
  });

  // TODO
  console.log('Errors ', formik.errors.appointments);

  return (
    <Container maxWidth='lg' sx={{ mt: 5 }}>
      <Grid container spacing={{ md: 1, lg: 1 }} columns={{ md: 6, lg: 6 }}>
        <Grid md={2} lg={2}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateCalendar
              value={date}
              minDate={dayjs()}
              maxDate={dayjs().add(1, 'year')}
              onChange={(newDate) => dateSelected(newDate ?? dayjs())}
            />
          </LocalizationProvider>
        </Grid>

        <Grid md={4} lg={4}>
          {isLoading ? (
            <Loader variation='linear' />
          ) : (
            <>
              <Typography variant='h5' fontWeight='bold' align='left' color='textPrimary' gutterBottom sx={{ mt: 2 }}>
                Schedule for {formatLongDateString(date)}
              </Typography>

              <form onSubmit={formik.handleSubmit}>
                {appointments?.map((appt: InputValues, index: number) => {
                  return (
                    <React.Fragment key={appt?.pk}>
                      <Grid container spacing={{ xs: 1 }} columns={{ xs: 12 }}>
                        <Grid xs={2}>
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <TimePicker
                              label='Start Time'
                              value={formik.values.appointments[index].sk}
                              disabled={formik.values.appointments[index].status === 'booked'}
                              onChange={(value) =>
                                formik.setFieldValue(`appointments[${index}].sk`, value ?? new Dayjs())
                              }
                              //renderInput={(params: any) => <TextField {...params} />}
                            />
                          </LocalizationProvider>
                        </Grid>
                        {/* <Grid xs={2}>
                            <TimePicker label='End Time' value={dayjs(appt?.sk).add(appt?.duration ?? 0, 'minutes')} disabled={appt?.status === 'booked'} />
                        </Grid> */}
                        <Grid xs={2}>
                          <TextField
                            label='Duration'
                            value={formik.values.appointments[index].duration}
                            disabled
                            error={
                              formik.touched.appointments &&
                              formik.touched.appointments[index].duration &&
                              Boolean(formik.errors.appointments && formik.errors.appointments[index])
                            }
                            helperText={
                              formik.touched.appointments && formik.errors && formik.errors.appointments?.toString()
                            }
                          />
                          {/* <ErrorMessage name="name"/> */}
                        </Grid>
                        <Grid xs={2}>
                          {appt?.status && (
                            <Chip
                              label={appt?.status}
                              color={appt?.status === 'available' ? 'success' : 'primary'}
                              variant={appt?.status === 'cancelled' ? 'outlined' : 'filled'}
                              sx={{ mb: 1, mt: 1.5 }}
                            />
                          )}
                        </Grid>
                        {appt?.status !== 'booked' && (
                          <Grid xs={2}>
                            <Button onClick={(e) => removeField(index)} variant='contained' color='error' sx={{ m: 1 }}>
                              Remove
                            </Button>
                          </Grid>
                        )}
                      </Grid>
                    </React.Fragment>
                  );
                })}
                <Button onClick={(e) => addField()} variant='contained' color='success' sx={{ m: 1 }}>
                  Add
                </Button>
                <Button
                  id='save'
                  name='save'
                  type='submit'
                  variant='contained'
                  onClick={(e) => {
                    console.log('Save');
                    formik.handleSubmit();
                    console.log('Saved');
                  }}
                  sx={{ m: 1 }}
                >
                  Save
                </Button>
              </form>
            </>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}

export default Schedule;
