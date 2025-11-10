import prisma from "@config/db";
import { UserUpdateData } from "src/types/User";

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
