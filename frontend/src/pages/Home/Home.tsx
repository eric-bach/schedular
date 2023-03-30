import * as React from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

function Home() {
  return (
    <Box justifyContent='center' alignItems='center' sx={{ mt: 5 }}>
      <Skeleton />
      <Skeleton animation='wave' />
      <Skeleton animation={false} />
    </Box>
  );
}

export default Home;
