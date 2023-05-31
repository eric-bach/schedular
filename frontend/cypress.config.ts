import { defineConfig } from 'cypress';

const defaultBaseUrl = 'http://localhost:3000';

export default defineConfig({
  e2e: {
    baseUrl: defaultBaseUrl,
    setupNodeEvents(on, config) {},
  },
  video: false,
});
