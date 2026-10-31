export type Role = "amind" | "viewer";

export type SessionUser = {
  id: string;
  email_address: string;
  role: Role;
};

export type SessionResponse = {
  user: SessionUser;
  csrf_token: string;
};
