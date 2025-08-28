import { render, screen } from '@testing-library/react';
import App from './App';

test('renders About section by default', async () => {
  render(<App />);
  // Title should include "Kavia AI" or "About Kavia AI"
  const title = await screen.findByText(/Kavia AI|About Kavia AI/i);
  expect(title).toBeInTheDocument();
});
