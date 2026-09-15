import { styled } from '@mui/material/styles';
import { Paper } from '@mui/material';

export const AuthContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: 400,
  margin: '40px auto',
  borderRadius: theme.spacing(2),
  boxShadow: '0 3px 10px rgba(0, 0, 0, 0.2)',
}));

export const FormContainer = styled('form')(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(1),
  '& .MuiTextField-root': {
    marginBottom: theme.spacing(2),
  },
  '& .MuiButton-root': {
    margin: theme.spacing(2, 0),
  },
}));

