import React from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { Formik, getIn, Form, Field, FieldArray } from 'formik';
import { useFormik } from 'formik';
import * as yup from 'yup';
import dayjs, { Dayjs } from 'dayjs';

interface Props {
  data?: string;
  onSubmit?: Function;
}

interface IFormValues {
  people: { name: string; surname: string; startTime: Dayjs }[];
}

const FieldComponent = ({ field, form: { touched, errors } }: any) => {
  const error = getIn(errors, field.name);
  const touch = getIn(touched, field.name);
  return (
    <div>
      <input type='text' name={field.name} onChange={field.onChange} />
      {touch && error ? <p>{error}</p> : null}
    </div>
  );
};

const FieldComponentTime = ({ field, form: { touched, errors } }: any) => {
  const error = getIn(errors, field.name);
  const touch = getIn(touched, field.name);
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <TimePicker
        label='Start Time'
        onChange={(value) => {
          field.setFieldValue('startTime', value);
        }}
      />
      {touch && error ? <p>{error}</p> : null}
    </LocalizationProvider>
  );
};

const FieldArrayComponent = (arrayHelpers: any) => (
  <div>
    {arrayHelpers.form.values.people.map((person: any, index: any) => (
      <div key={index}>
        <Field name={`people.${index}.name`} component={FieldComponent} />
        <Field name={`people.${index}.surname`} component={FieldComponent} />
        <Field name={`people.${index}.startTime`} component={FieldComponentTime} />
        <button type='button' onClick={() => arrayHelpers.push({ name: '', surname: '', startTime: dayjs() })}>
          +
        </button>
        <button type='button' onClick={() => arrayHelpers.remove(index)}>
          -
        </button>
      </div>
    ))}
    <div>
      <button type='submit'>Submit</button>
    </div>
  </div>
);

function Test() {
  const initialValues: IFormValues = {
    people: [{ name: '', surname: '', startTime: dayjs() }],
  };
  const schema = yup.object().shape({
    people: yup.array().of(
      yup.object().shape({
        name: yup.string().required('Name is required'),
        surname: yup.string().required('Surname is required'),
        startTime: yup.string().required('Time is required'),
      })
    ),
  });
  return (
    <Formik
      initialValues={initialValues}
      onSubmit={(values) => {
        console.log(values);
      }}
      validationSchema={schema}
      render={({ values, errors }) => {
        console.log(values, errors);
        return (
          <Form>
            <FieldArray name='people' component={FieldArrayComponent} />
          </Form>
        );
      }}
    />
  );
}

export default Test;
