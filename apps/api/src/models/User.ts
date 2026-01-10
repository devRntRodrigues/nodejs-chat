import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from '@node-rs/bcrypt';

export interface IUser {
  name: string;
  username: string;
  passwordHash: string;
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name must not exceed 50 characters'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must not exceed 30 characters'],
      match: [
        /^[a-z0-9_]+$/,
        'Username can only contain lowercase letters, numbers, and underscores',
      ],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    lastSeen: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const { passwordHash: _passwordHash, __v, ...safe } = ret;
        return safe;
      },
    },
  }
);

userSchema.index({ username: 1 });
userSchema.index({ lastSeen: -1 });

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = mongoose.model<IUserDocument>('User', userSchema);
