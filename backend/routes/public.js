import express from 'express';
import User from '../models/User.js';

const router = express.Router();

router.get('/organizers', async (req, res) => {
  try {
    const organizers = await User.find({ 
      role: 'organizer', 
      isActive: true 
    })
      .select('firstName lastName organizerName category description')
      .sort({ organizerName: 1 });

    res.status(200).json({
      success: true,
      count: organizers.length,
      organizers,
    });
  } catch (error) {
    console.error('Get Public Organizers Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizers',
      error: error.message,
    });
  }
});

router.get('/organizers/:id', async (req, res) => {
  try {
    const organizer = await User.findById(req.params.id)
      .select('firstName lastName organizerName category description contactEmail role');

    if (!organizer || organizer.role !== 'organizer') {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
      });
    }

    res.status(200).json({
      success: true,
      data: organizer,
    });
  } catch (error) {
    console.error('Get Public Organizer Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizer',
      error: error.message,
    });
  }
});

export default router;
