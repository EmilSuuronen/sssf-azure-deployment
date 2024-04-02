// TODO: create the following functions:

import {Request, Response, NextFunction} from 'express';
import CustomError from '../../classes/CustomError';
import userModel from '../models/userModel';
import bcrypt from 'bcryptjs';
import {User, userData} from '../../types/DBTypes';
import {MessageResponse} from '../../types/MessageTypes';

// - userListGet - get all users
const userListGet = async (
  req: Request,
  res: Response<User[]>,
  next: NextFunction
) => {
  try {
    const users = await userModel.find().select('-password -__v -role');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// - userGet - get user by id
const userGet = async (
  req: Request<{id: string}, {}, {}>,
  res: Response<User>,
  next: NextFunction
) => {
  try {
    const user = await userModel
      .findById(req.params.id)
      .select('-password -__v -role');
    if (!user) {
      throw new CustomError('No user found', 404);
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// - userPost - create new user. Remember to hash password
const userPost = async (
  req: Request<{}, {}, Omit<User, 'user_id'>>,
  res: Response<MessageResponse & {data: userData}>,
  next: NextFunction
) => {
  try {
    req.body.role = 'user';
    req.body.password = bcrypt.hashSync(req.body.password, 12);
    const user = await userModel.create(req.body);
    const _user: userData = {...user};
    const response = {
      message: 'User added',
      data: _user,
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
};

// - userPutCurrent - update current user
const userPutCurrent = async (
  req: Request<{}, {}, Omit<User, 'user_id'>>,
  res: Response<MessageResponse & {data: userData}>,
  next: NextFunction
) => {
  try {
    const id = res.locals.user._id;
    const user = await userModel
      .findByIdAndUpdate(id, req.body, {
        new: true,
      })
      .select('-password -__v -role');
    if (!user) {
      throw new CustomError('No user found', 404);
    }
    const response = {
      message: 'User updated',
      data: user,
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
};

// - userDeleteCurrent - delete current user
const userDeleteCurrent = async (
  req: Request<{}, {}, {}>,
  res: Response<MessageResponse & {data: userData}>,
  next: NextFunction
) => {
  try {
    const id = res.locals.user._id;
    const user = await userModel
      .findByIdAndDelete(id)
      .select('-password -__v -role');
    if (!user) {
      throw new CustomError('No user found', 404);
    }
    const response = {
      message: 'User deleted',
      data: user,
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
};

// - checkToken - check if current user token is valid: return data from res.locals.user as UserOutput. No need for database query
const checkToken = async (
  req: Request,
  res: Response<userData>,
  next: NextFunction
): Promise<userData | null> => {
  try {
    if (res.locals.user) {
      const user = res.locals.user;
      const userData: userData = {
        _id: user._id,
        user_name: user.user_name,
        email: user.email,
      };
      res.json(userData);
      return userData;
    } else {
      return null;
    }
  } catch (error) {
    next(error);
    return null;
  }
};

export {
  userListGet,
  userGet,
  userPost,
  userPutCurrent,
  userDeleteCurrent,
  checkToken,
};
