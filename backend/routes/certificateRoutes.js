const express = require('express');
const router  = express.Router();
const {
  generateCertificate, getUserCertificates, verifyCertificate, getAllCertificates
} = require('../controllers/certificateController');
const auth = require('../middleware/auth');

router.post('/certificates',                    generateCertificate);
router.get('/certificates/user/:userId',        getUserCertificates);
router.get('/certificates/verify/:certNumber',  verifyCertificate);
router.get('/certificates',                     auth, getAllCertificates);

module.exports = router;
