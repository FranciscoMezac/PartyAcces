import { describe, expect, it } from 'vitest';

import homeService from '../../app/services/homeService.js';

describe('homeService', () => {
  it('devuelve un view model básico', () => {
    const viewModel = homeService.getLandingViewModel();

    expect(viewModel).toHaveProperty('hero');
    expect(viewModel.actions.length).toBeGreaterThan(0);
  });
});
