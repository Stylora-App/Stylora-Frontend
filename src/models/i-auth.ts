import { IUser } from './i-user';

export interface IAuthResponse {
  success: boolean;
  message?: string;
  user?: IUser;
}

export interface ILoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}
