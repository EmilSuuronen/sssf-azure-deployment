import {userData} from './DBTypes';

type MessageResponse = {
  message: string;
};

type ErrorResponse = MessageResponse & {
  stack?: string;
};

type LoginResponse = {
  token: string;
  user: userData;
};

type UploadResponse = MessageResponse & {
  id: number;
};

export {MessageResponse, ErrorResponse, LoginResponse, UploadResponse};
