import { Container, Skeleton } from '@mui/material';

function Home() {
  return (
    <Container maxWidth='xl' sx={{ mt: 5 }}>
      Home
      <Skeleton />
      <Skeleton />
      <Skeleton animation='wave' />
      <Skeleton animation='wave' />
      <Skeleton animation={false} />
      <Skeleton animation={false} />
    </Container>
  );
}

export default Home;
