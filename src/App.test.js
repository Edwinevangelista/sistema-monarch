import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the FinGuide auth screen', async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { name: /FinGuide/i, level: 1 })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Iniciar Sesión/i })).toBeInTheDocument();
});
