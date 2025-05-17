const express = require('express');
const { 
  getBlockchainInfo, 
  getAllBlocks, 
  getBlockByIndex, 
  mineBlock, 
  validateChain 
} = require('../controllers/blockchainController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/info', protect, getBlockchainInfo);
router.get('/blocks', protect, getAllBlocks);
router.get('/blocks/:index', protect, getBlockByIndex);
router.post('/mine', protect, mineBlock);
router.get('/validate', protect, validateChain);

module.exports = router;