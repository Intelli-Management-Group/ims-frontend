import apiClient from "./client";
import type { LoginResponse, AuthUser } from "../types/api";

export const authApi = {
	login: async (credentials: any) => {
		const { data } = await apiClient.post<LoginResponse>(
			"/auth/login",
			credentials,
		);
		return data;
	},

	logout: async () => {
		const { data } = await apiClient.post("/auth/logout");
		return data;
	},

	me: async (): Promise<AuthUser | null> => {
		try {
			const { data } = await apiClient.get<{ data: AuthUser | null }>(
				"/auth/me",
			);

			return data.data;
		} catch {
			return null;
		}
	},

	refresh: async () => {
		const { data } = await apiClient.post<LoginResponse>(
			"/auth/refresh",
		);
		return data;
	},

	changePassword: async (passwords: any) => {
		const { data } = await apiClient.post(
			"/auth/change-password",
			passwords,
		);
		return data;
	},
};
