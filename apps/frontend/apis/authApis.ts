import axios from "axios";
import {
  TUser,
  TCompany,
  TUserRegistration,
  TOtpVerify,
  TLogin,
} from "@repo/common/types";
import { BACKEND_URL } from "../constants";

interface ApiResponse<T> {
  message: string;
  data: T;
}

export const register = async (
  data: TUserRegistration
): Promise<ApiResponse<null>> => {
  const response = await axios.post(`${BACKEND_URL}/auth/registration`, data);
  return response.data;
};

export const verifyOtp = async (
  data: TOtpVerify
): Promise<ApiResponse<null>> => {
  const response = await axios.post(`${BACKEND_URL}/auth/verify`, data);
  return response.data;
};

export const login = async (
  data: TLogin
): Promise<
  ApiResponse<{ user: TUser; activeCompany: TCompany | null; token: string }>
> => {
  const response = await axios.post(`${BACKEND_URL}/auth/login`, data);
  if (response.data.data.token) {
    localStorage.setItem("jwt_token", response.data.data.token);
  }
  return response.data;
};

export const getMe = async (
  token: string
): Promise<ApiResponse<{ user: TUser; activeCompany: TCompany | null }>> => {
  const response = await axios.get(`${BACKEND_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const logout = async (token: string): Promise<ApiResponse<null>> => {
  try {
    const response = await axios.post(`${BACKEND_URL}/auth/logout`, null, {
      headers: { Authorization: `Bearer ${token}` },
    });

    localStorage.removeItem("jwt_token");
    return response.data;
  } catch (error) {
    localStorage.removeItem("jwt_token");
    throw error;
  }
};
