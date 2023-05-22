import { createRoot } from 'react-dom/client';
import App from './App';
import { Amplify } from 'aws-amplify';

//import aws_exports from './aws-exports';

const root = createRoot(document.getElementById('root') as HTMLElement);

//Amplify.configure(aws_exports);

root.render(<App />);
