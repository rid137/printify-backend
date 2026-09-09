import mongoose, { Schema, model, Document } from 'mongoose';

export interface IDeviceToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  platform?: 'android' | 'ios' | 'web';
  createdAt: Date;
  updatedAt: Date;
}

const deviceTokenSchema = new Schema<IDeviceToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true },
    platform: { type: String, enum: ['android', 'ios', 'web'] },
  },
  { timestamps: true }
);

// Compound index to speed up lookups and make sure a user can have only one of a specific token
deviceTokenSchema.index({ userId: 1, token: 1 }, { unique: true });

const DeviceToken = model<IDeviceToken>('DeviceToken', deviceTokenSchema);

export default DeviceToken;