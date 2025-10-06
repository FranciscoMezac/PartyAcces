import homeService from '../services/homeService.js';

const index = (req, res, next) => {
  try {
    const viewModel = homeService.getLandingViewModel();
    res.render('home/index', viewModel);
  } catch (error) {
    next(error);
  }
};

export default {
  index
};

