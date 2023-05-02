import React, { useState } from 'react';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Chip, TextField } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { useForm, SubmitHandler } from 'react-hook-form';

import { AppointmentItem } from '../../types/BookingTypes';

type Inputs = {
  startTime: Dayjs;
};

export default function ScheduleDay({ appointments, date }: { appointments: [AppointmentItem] | undefined; date: string }) {
  const [fields, setFields] = useState<[AppointmentItem] | undefined>(appointments);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>();
  const onSubmit: SubmitHandler<Inputs> = (data) => console.log('onSubmit: ', data);

  console.log(watch('startTime'));

  function addField() {
    if (!fields) return;

    const values: [AppointmentItem] | undefined = [...fields];
    values.push({
      // TODO Temporarily set GUID so key is unique in map
      pk: `appt#${uuidv4()}`,
      sk: '',
      type: 'appt',
      category: 'massage',
      duration: 0,
      status: '',
    });
    setFields(values);

    console.log('ADDED NEW FIELDS', fields);
  }

  function removeField(index: number) {
    if (!fields) return;

    const values: [AppointmentItem] | undefined = [...fields];
    values[index].status = 'pending*';
    // Remove from state
    // values.pop();
    setFields(values);

    console.log('REMOVED FIELDS', fields);
  }

  function handleChangeInput(index: number, time: Dayjs) {
    if (!fields) return;

    const values: [AppointmentItem] | undefined = [...fields];

    values[index].sk = time.set('second', 0).set('millisecond', 0).toISOString();
    values[index].status = 'available';
    values[index].duration = 60;
    console.log('VALUES', values[index]);

    setFields(values);
    console.log('UPDATED VALUES', fields);
  }

  return (
    <React.Fragment key={date}>
      <Accordion defaultExpanded={appointments != undefined}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls='panel1a-content' id='panel1a-header'>
          <Typography>{date}</Typography>
        </AccordionSummary>

        <AccordionDetails>
          <form onSubmit={handleSubmit(onSubmit)}>
            {fields?.map((appt: AppointmentItem | undefined, index) => {
              return (
                <React.Fragment key={appt?.pk}>
                  <Grid container spacing={{ xs: 1 }} columns={{ xs: 10 }}>
                    <Grid xs={2}>
                      <TimePicker
                        label='Start Time'
                        value={dayjs(appt?.sk)}
                        disabled={appt?.status === 'booked'}
                        {...register('startTime')}
                        onChange={(e) => handleChangeInput(index, e ?? new Dayjs())}
                      />
                    </Grid>
                    {/* <Grid xs={2}>
                      <TimePicker label='End Time' value={dayjs(appt?.sk).add(appt?.duration ?? 0, 'minutes')} disabled={appt?.status === 'booked'} />
                    </Grid> */}
                    <Grid xs={2}>
                      <TextField label='Duration' value={dayjs(appt?.duration)} disabled />
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
            <Button type='submit' variant='contained' sx={{ m: 1 }}>
              Save
            </Button>
          </form>
        </AccordionDetails>
      </Accordion>
    </React.Fragment>
  );
}
