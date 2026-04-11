export interface IUserProfile {
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  style?: string;
  season?: string;
  subSeason?: string;
  palette?: string[];
}

export interface IUpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  style?: string;
}
