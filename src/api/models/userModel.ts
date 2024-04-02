// TODO: mongoose schema for user
import mongoose from 'mongoose';
import {User} from '../../types/DBTypes';

const userSchema = new mongoose.Schema({
  _id: {type: mongoose.Schema.Types.ObjectId, auto: true},
  user_name: {type: String, minlength: 2, required: true},
  email: {type: String, minlength: 2, required: true, unique: true},
  role: {
    type: String,
    required: true,
    enum: ['user', 'admin'],
  },
  password: {type: String, minlength: 4, required: true},
});

export default mongoose.model<User>('User', userSchema);
