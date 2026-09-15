const { ChatMessage } = require('../models/message.model');

const listHistory = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: 'videoId is required',
      });
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);

    const messages = await ChatMessage.find({ videoId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      messages: messages.reverse(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listHistory,
};
