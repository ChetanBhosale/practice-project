// src/lib/companyApi.ts
import axios from "axios";
import { BACKEND_URL } from "../constants";
import { TCompany, TUserCompany } from "@repo/common/types";

interface ApiResponse<T> {
  message: string;
  data: T | any;
}

const getAuthHeader = () => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;
  console.log(token);
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const createCompany = async (data: {
  name: string;
  address: string;
}): Promise<ApiResponse<TCompany>> => {
  const response = await axios.post(
    `${BACKEND_URL}/company/create`,
    data,
    getAuthHeader()
  );
  return response.data;
};

export const joinCompany = async (
  companyId: string
): Promise<ApiResponse<TUserCompany>> => {
  const response = await axios.post(
    `${BACKEND_URL}/company/join`,
    { companyId },
    getAuthHeader()
  );
  return response.data;
};

export const searchCompanies = async (
  query: string
): Promise<ApiResponse<TCompany[]>> => {
  const response = await axios.get(`${BACKEND_URL}/company/search`, {
    params: { name: query },
    ...getAuthHeader(),
  });
  return response.data;
};

export const getALlCompanies = async () => {
  const response = await axios.get(`${BACKEND_URL}/company/companies`, {
    ...getAuthHeader(),
  });
  return response.data;
};

export const getCompanyDetails = async (
  companyId: string
): Promise<ApiResponse<TCompany>> => {
  const response = await axios.get(`${BACKEND_URL}/company/${companyId}`, {
    ...getAuthHeader(),
  });
  return response.data;
};

export const updateCompany = async (
  companyId: string,
  data: Partial<TCompany>
): Promise<ApiResponse<TCompany>> => {
  const response = await axios.patch(
    `${BACKEND_URL}/company/${companyId}`,
    data,
    { ...getAuthHeader() }
  );
  return response.data;
};

export const removeUserFromCompany = async (
  companyId: string,
  userId: string
): Promise<ApiResponse<null>> => {
  const response = await axios.post(
    `${BACKEND_URL}/company/remove-user`,
    { companyId, userId },
    { ...getAuthHeader() }
  );
  return response.data;
};

export const switchActiveCompany = async (
  companyId: string
): Promise<ApiResponse<{ token: string }>> => {
  const response = await axios.post(
    `${BACKEND_URL}/company/switch`,
    { companyId },
    { ...getAuthHeader() }
  );
  return response.data;
};
