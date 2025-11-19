export interface UserUpdateData {
  fullName?: string;
  firstname?: string;
  lastname?: string;
  gender?: string;
  dob?: Date;
  meansOfIdentification?: string;
  validIDNumber?: string;
  idDate?: Date;
  fullAddress?: string;
  taxNumber?: string;
  purposeOfShiftremit?: string;
  profilePhotoUrl?: string;

  alertWhenGbpToNgnDropsBelow?: number;
  alertWhenNgnToGbpDropsBelow?: number;
  sendMeNotifs?: boolean;
}
