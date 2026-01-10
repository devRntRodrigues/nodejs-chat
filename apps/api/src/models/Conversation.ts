import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IConversation {
  participants: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
  lastMessagePreview?: string;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversationDocument extends IConversation, Document {}

const conversationSchema = new Schema<IConversationDocument>(
  {
    participants: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      required: true,
      validate: {
        validator: function (v: Types.ObjectId[]) {
          return v.length === 2;
        },
        message: 'A conversation must have exactly 2 participants',
      },
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    lastMessagePreview: {
      type: String,
      default: '',
      maxlength: 100,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ 'participants.0': 1, 'participants.1': 1 }, { unique: true });

conversationSchema.pre('save', function (next) {
  if (this.isModified('participants')) {
    this.participants.sort((a, b) => a.toString().localeCompare(b.toString()));
  }
  next();
});

export const Conversation = mongoose.model<IConversationDocument>(
  'Conversation',
  conversationSchema
);
