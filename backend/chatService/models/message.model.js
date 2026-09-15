const { mongoose } = require('../db');

const messageSchema = new mongoose.Schema(
  {
    videoId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'user',
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
  },
);

messageSchema.index({ videoId: 1, createdAt: -1 });

const ChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', messageSchema);

module.exports = { ChatMessage, messageSchema };
