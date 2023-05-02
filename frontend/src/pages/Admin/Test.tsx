import React from 'react';
import { Formik, getIn, Form, Field, FieldArray } from 'formik';
import * as yup from 'yup';

interface Props {
  data?: string;
  onSubmit?: Function;
}

interface IFormValues {
  people: { name: string; surname: string }[];
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

const FieldArrayComponent = (arrayHelpers: any) => (
  <div>
    {arrayHelpers.form.values.people.map((person: any, index: any) => (
      <div key={index}>
        <Field name={`people.${index}.name`} component={FieldComponent} />
        <Field name={`people.${index}.surname`} component={FieldComponent} />
        <button type='button' onClick={() => arrayHelpers.push({ name: '', surname: '' })}>
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
    people: [{ name: '', surname: '' }],
  };
  const schema = yup.object().shape({
    people: yup.array().of(
      yup.object().shape({
        name: yup.string().required('Required'),
        surname: yup.string().required('Required'),
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
