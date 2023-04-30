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

import { AppointmentItem } from '../../types/BookingTypes';

export default function ScheduleDay({ appointments, d }: { appointments: [AppointmentItem] | undefined; d: string }) {
  const [fields, setFields] = useState<[AppointmentItem] | undefined>(appointments);

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

  function removeField() {
    if (!fields) return;

    const values: [AppointmentItem] | undefined = [...fields];
    values.pop();
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
    <React.Fragment key={d}>
      <Accordion defaultExpanded={appointments != undefined}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls='panel1a-content' id='panel1a-header'>
          <Typography>{d}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <form>
            {fields?.map((appt: AppointmentItem | undefined, index) => {
              return (
                <React.Fragment key={appt?.pk}>
                  <Grid container spacing={{ xs: 1 }} columns={{ xs: 10 }}>
                    <Grid xs={2}>
                      <TimePicker
                        label='Start Time'
                        value={dayjs(appt?.sk)}
                        disabled={appt?.status === 'booked'}
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
                          color={appt?.status === 'booked' ? 'primary' : 'success'}
                          variant={appt?.status === 'cancelled' ? 'outlined' : 'filled'}
                          sx={{ mb: 1 }}
                        />
                      )}
                    </Grid>
                    {appt?.status !== 'booked' && (
                      <Grid xs={2}>
                        <Button onClick={(e) => removeField()}>Remove</Button>
                      </Grid>
                    )}
                  </Grid>
                </React.Fragment>
              );
            })}
            <Button onClick={(e) => addField()}>Add</Button>
          </form>
        </AccordionDetails>
      </Accordion>
    </React.Fragment>
  );
}
