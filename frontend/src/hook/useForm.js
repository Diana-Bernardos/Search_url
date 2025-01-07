// src/hooks/useForm.js
import { useState } from 'react';

export const useForm = (initialState = {}) => {
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setValues({
      ...values,
      [e.target.name]: e.target.value
    });
  };

  const reset = () => {
    setValues(initialState);
    setErrors({});
  };

  return { values, errors, handleChange, setErrors, reset };
};