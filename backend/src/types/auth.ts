import type { Role } from "../../generated/prisma/client.js";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  centreId: string | null;
  districtId: string | null;
};

export type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
};
