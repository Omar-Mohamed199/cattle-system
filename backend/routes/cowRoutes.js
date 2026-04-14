const express = require('express');
const router = express.Router();
const {
  getCows,
  createCow,
  updateCow,
  deleteCow,
} = require('../controllers/cowController');

router.route('/')
  .get(getCows)
  .post(createCow);

router.route('/:id')
  .put(updateCow)
  .delete(deleteCow);

module.exports = router;
