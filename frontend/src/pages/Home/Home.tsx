import { useNavigate } from 'react-router-dom';
import { Button, Container, Grid, Typography } from '@mui/material';
import { styled } from '@mui/system';

const Image = styled('img')({
  maxWidth: '100%',
  height: 'auto',
});

function Home() {
  const navigate = useNavigate();

  return (
    <Container maxWidth='xl' sx={{ mt: 5 }}>
      <Typography variant='h4' gutterBottom>
        Welcome to the SPA
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant='body1' gutterBottom>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed gravida a tortor ullamcorper mattis. Nullam tincidunt tempus iaculis. Cras ullamcorper
            porta venenatis. Sed tincidunt massa mauris, eget volutpat nunc tristique quis. Integer sed scelerisque nisi, et sodales ante. Mauris at neque
            congue, eleifend ligula ut, tincidunt arcu. Suspendisse a aliquam felis, et tristique lacus. Nam eu lacinia tellus. Cras ante leo, convallis vitae
            malesuada ut, scelerisque sed ipsum.
          </Typography>
          <Typography variant='body2' gutterBottom sx={{ mt: 8, fontStyle: 'italic' }}>
            Book your appointment now!
          </Typography>
          <Button color='primary' variant='contained' onClick={() => navigate('/calendar')}>
            Book Appointment
          </Button>
        </Grid>
        <Grid item xs={12} md={6}>
          <Image src='img/spa.jpg' alt='Massage Therapist' />
        </Grid>
      </Grid>
    </Container>
  );
}

export default Home;
