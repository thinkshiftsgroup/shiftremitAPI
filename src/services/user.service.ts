import prisma from "@config/db";
import { UserUpdateData } from "src/types/User";
import { MulterFile } from "src/types/Upload";
import { uploadToCloudinary } from "@utils/cloudinary";
import { hashPassword, comparePassword } from "@utils/helpers";
import { InCorrectOldPasswordError } from "@middlewares/error.custom";
export async function getBasicProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      firstname: true,
      lastname: true,
      middlename: true,
      phoneNumber: true,
      politicalExposure: true,
      country: true,
      gender: true,
      dob: true,
      meansOfIdentification: true,
      validIDNumber: true,
      idDate: true,
      fullAddress: true,
      taxNumber: true,
      purposeOfShiftremit: true,
      profilePhotoUrl: true,
      biodata: true,
      alertWhenGbpToNgnDropsBelow: true,
      alertWhenNgnToGbpDropsBelow: true,
      sendMeNotifs: true,
    },
  });

  return user;
}

export async function updateBasicProfile(userId: string, data: UserUpdateData) {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      dob: data.dob ? new Date(data.dob) : undefined,
      idDate: data.idDate ? new Date(data.idDate) : undefined,
    },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      firstname: true,
      lastname: true,
      middlename: true,
      phoneNumber: true,
      politicalExposure: true,
      country: true,
      gender: true,
      dob: true,
      meansOfIdentification: true,
      validIDNumber: true,
      idDate: true,
      fullAddress: true,
      taxNumber: true,
      purposeOfShiftremit: true,
      profilePhotoUrl: true,
      biodata: true,
      alertWhenGbpToNgnDropsBelow: true,
      alertWhenNgnToGbpDropsBelow: true,
      sendMeNotifs: true,
    },
  });

  return updatedUser;
}

export async function updateProfilePhoto(
  userId: string,
  profilePhotoUrl: string
) {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      profilePhotoUrl: profilePhotoUrl,
    },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      firstname: true,
      lastname: true,
      middlename: true,
      phoneNumber: true,
      politicalExposure: true,
      country: true,
      gender: true,
      dob: true,
      meansOfIdentification: true,
      validIDNumber: true,
      idDate: true,
      fullAddress: true,
      taxNumber: true,
      purposeOfShiftremit: true,
      profilePhotoUrl: true,
      biodata: true,
    },
  });

  return updatedUser;
}

export async function updateProfilePhotoApp(userId: string, file: MulterFile) {
  const profilePhotoUrl = await uploadToCloudinary(file, "image");

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      profilePhotoUrl: profilePhotoUrl,
    },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      firstname: true,
      lastname: true,
      middlename: true,
      phoneNumber: true,
      politicalExposure: true,
      country: true,
      gender: true,
      dob: true,
      meansOfIdentification: true,
      validIDNumber: true,
      idDate: true,
      fullAddress: true,
      taxNumber: true,
      purposeOfShiftremit: true,
      profilePhotoUrl: true,
      biodata: true,
    },
  });

  return updatedUser;
}

export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      password: true,
    },
  });

  if (!user || !user.password) {
    throw new Error("User or password not found");
  }

  const isMatch = await comparePassword(oldPassword, user.password);

  if (!isMatch) {
    throw new InCorrectOldPasswordError("Incorrect old password");
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
    },
  });
  return { success: true, message: "Password updated successfully" };
}
