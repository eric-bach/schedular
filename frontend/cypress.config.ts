import { defineConfig } from 'cypress';

const defaultBaseUrl = 'http://localhost:3000';

export default defineConfig({
  e2e: {
    baseUrl: defaultBaseUrl,
    setupNodeEvents(on, config) {
      require('cypress-log-to-output').install(on);

      console.log('🚀 URL', config.env.url);

      config.baseUrl = config.env.url;

      return config;
    },
  },
  video: false,
});
