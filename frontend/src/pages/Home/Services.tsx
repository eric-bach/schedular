import React from 'react';
import { Container, Skeleton } from '@mui/material';

export default function Services() {
  return (
    <Container maxWidth='xl' sx={{ mt: 5 }}>
      Services
      <Skeleton />
      <Skeleton />
      <Skeleton animation='wave' />
      <Skeleton animation='wave' />
      <Skeleton animation={false} />
      <Skeleton animation={false} />
    </Container>
  );
}
