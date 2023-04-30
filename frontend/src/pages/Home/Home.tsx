import Container from '@mui/material/Container';
import Skeleton from '@mui/material/Skeleton';

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
