import {Request, Response, NextFunction} from 'express';
import {MessageResponse} from '../../types/MessageTypes';
import catModel from '../models/catModel';
import {Cat} from '../../types/DBTypes';
import {validationResult} from 'express-validator';
import CustomError from '../../classes/CustomError';

// - catGetByUser - get all cats by current user id
const catGetByUser = async (
  req: Request<{id: string}>,
  res: Response<Cat[]>,
  next: NextFunction
) => {
  const user = res.locals.user._id;
  if (!user) {
    throw new CustomError('No user', 400);
  }
  try {
    const cat = await catModel.find({owner: user}).populate({
      path: 'owner',
      select: '_id user_name email',
    });
    if (!cat) {
      throw new CustomError('Error finding cat by user', 404);
    }
    res.json(cat);
  } catch (error) {
    next(error);
  }
};

// - catGetByBoundingBox - get all cats by bounding box coordinates (getJSON)
const catGetByBoundingBox = async (
  req: Request<{}, {}, {}, {topRight: string; bottomLeft: string}>,
  res: Response<Cat[]>,
  next: NextFunction
) => {
  try {
    const {topRight, bottomLeft} = req.query;
    const rightCorner = topRight.split(',');
    const leftCorner = bottomLeft.split(',');

    const cats = await catModel.find({
      location: {
        $geoWithin: {
          $box: [leftCorner, rightCorner],
        },
      },
    });

    res.json(cats);
  } catch (error) {
    next(error);
  }
};

// - catPutAdmin - only admin can change cat owner
const catPutAdmin = async (
  req: Request<{id: string}, {}, Cat>,
  res: Response<MessageResponse & {data: Cat}>,
  next: NextFunction
) => {
  try {
    const cat = req.body;
    if (!res.locals.user || res.locals.user.role !== 'admin') {
      throw new CustomError('Not admin', 400);
    }
    const result = await catModel.findByIdAndUpdate(req.params.id, cat, {
      new: true,
    });
    if (!result) {
      throw new CustomError('Cat not found', 404);
    }
    const response = {
      message: 'Cat modified by admin',
      data: result,
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
};

// - catListGet - get all cats
const catListGet = async (
  req: Request,
  res: Response<Cat[]>,
  next: NextFunction
) => {
  try {
    const catsData = await catModel
      .find()
      .select('-__v')
      .populate('owner', '-__v -password -role');
    res.json(catsData);
  } catch (error) {
    next(error);
  }
};

// - catGet - get cat by id
const catGet = async (
  req: Request<{id: string}>,
  res: Response<Cat>,
  next: NextFunction
) => {
  try {
    const cat = await catModel.findById(req.params.id).populate({
      path: 'owner',
      select: '_id user_name email',
    });
    if (!cat) {
      throw new CustomError('No cat found', 404);
    }
    res.json(cat);
  } catch (error) {
    next(error);
  }
};

// - catPost - create new cat
const catPost = async (
  req: Request<{}, {}, Partial<Cat>>,
  res: Response<MessageResponse & {data: Cat}>,
  next: NextFunction
) => {
  const errors = validationResult(req.body);
  if (!errors.isEmpty()) {
    const messages: string = errors
      .array()
      .map((error) => `${error.msg}: ${error.param}`)
      .join(', ');
    next(new CustomError(messages, 400));
    return;
  }

  const filename = req.file?.filename;
  const owner = res.locals.user._id;
  const coords = res.locals.coords;

  if (typeof filename === 'string') {
    const newCat = {
      cat_name: req.body.cat_name,
      weight: Number(req.body.weight),
      owner: owner,
      filename,
      birthdate: req.body.birthdate,
      location: coords,
    };

    try {
      const result = await catModel.create(newCat);
      if (!result) {
        throw new CustomError('Error creating a cat', 500);
      }
      const response = {
        message: 'Cat added',
        data: result,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
};

// - catPut - only owner can update cat
const catPut = async (
  req: Request<{id: string}, {}, Cat>,
  res: Response<MessageResponse & {data: Cat}>,
  next: NextFunction
) => {
  try {
    const cat = req.body;
    const user = res.locals.user._id;
    if (!user) {
      throw new CustomError('No user', 400);
    }
    const result = await catModel.findOneAndUpdate(
      {_id: req.params.id, owner: user},
      cat,
      {new: true}
    );
    if (!result) {
      throw new CustomError('Cat not found', 404);
    }
    const response = {
      message: 'Cat modified by owner',
      data: result,
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
};

// - catDelete - only owner can delete cat
const catDelete = async (
  req: Request<{id: string}, {}, Cat>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  try {
    const result = await catModel.findOneAndDelete({
      _id: req.params.id,
      owner: res.locals.user._id,
    });
    if (!result) {
      throw new Error('No cat found');
    }
    const response = {
      message: 'cat deleted by owner',
      data: result,
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
};

// - catDeleteAdmin - only admin can delete cat
const catDeleteAdmin = async (
  req: Request<{id: string}, {}, Cat>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  try {
    if (!res.locals.user || res.locals.user.role !== 'admin') {
      throw new CustomError('Not admin', 400);
    }
    const result = await catModel.findByIdAndDelete(req.params.id);
    if (!result) {
      throw new Error('No cat found');
    }
    const response = {
      message: 'cat deleted by admin',
      data: result,
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
};

export {
  catListGet,
  catGet,
  catGetByUser,
  catPost,
  catPut,
  catDelete,
  catPutAdmin,
  catDeleteAdmin,
  catGetByBoundingBox,
};
