const express = require('express');
const router  = express.Router();
const { getSchedules, getPublicSchedules, createSchedule, updateSchedule, deleteSchedule } = require('../controllers/scheduleController');
const auth = require('../middleware/auth');

router.get('/schedules/public',   getPublicSchedules);   // public — no auth
router.get('/schedules',          auth, getSchedules);
router.post('/schedules',         auth, createSchedule);
router.put('/schedules/:id',      auth, updateSchedule);
router.delete('/schedules/:id',   auth, deleteSchedule);

module.exports = router;
