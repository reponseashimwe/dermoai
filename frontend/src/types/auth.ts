import type { User } from "./api";

export interface TokenPayload {
  sub: string;
  role: string;
  type: "access" | "refresh";
  exp: number;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone_number?: string;
    role: string;
    practitioner_type?: string;
    expertise?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}
