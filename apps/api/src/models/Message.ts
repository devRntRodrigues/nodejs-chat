import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMessage {
  from: Types.ObjectId;
  to: Types.ObjectId;
  content: string;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
}

export interface IMessageDocument extends IMessage, Document {}

const messageSchema = new Schema<IMessageDocument>(
  {
    from: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
      index: true,
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required'],
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [5000, 'Message must not exceed 5000 characters'],
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

messageSchema.index({ from: 1, to: 1, createdAt: -1 });
messageSchema.index({ from: 1, to: 1, read: 1 });
messageSchema.index({ createdAt: -1 });

export const Message = mongoose.model<IMessageDocument>('Message', messageSchema);
