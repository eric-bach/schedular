import React from 'react';
import { useParams } from 'react-router-dom';

export default function Confirmation() {
  const { id: confirmationId } = useParams();

  return <div>Confirmation Id {confirmationId}</div>;
}
