import React from 'react';
import { Container, Skeleton } from '@mui/material';

export default function Pricing() {
  return (
    <Container maxWidth='xl' sx={{ mt: 5 }}>
      Pricing
      <Skeleton />
      <Skeleton />
      <Skeleton animation='wave' />
      <Skeleton animation='wave' />
      <Skeleton animation={false} />
      <Skeleton animation={false} />
    </Container>
  );
}
