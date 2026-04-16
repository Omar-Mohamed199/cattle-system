const express = require('express');
const router = express.Router();
const {
  getSheep,
  createSheep,
  updateSheep,
  deleteSheep,
} = require('../controllers/sheepController');

router.route('/')
  .get(getSheep)
  .post(createSheep);

router.route('/:id')
  .put(updateSheep)
  .delete(deleteSheep);

module.exports = router;
