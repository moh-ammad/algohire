export type Role = "CENTRE" | "DISTRICT" | "QUALITY" | "STATE";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  centreId: string | null;
  districtId: string | null;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export const DEMO_USERS: Array<{
  name: string;
  email: string;
  role: Role;
  blurb: string;
}> = [
  {
    name: "Anika",
    email: "anika@centre.test",
    role: "CENTRE",
    blurb: "Training centre",
  },
  {
    name: "Dev",
    email: "dev@district.test",
    role: "DISTRICT",
    blurb: "District officer",
  },
  {
    name: "Meera",
    email: "meera@district.test",
    role: "DISTRICT",
    blurb: "District officer",
  },
  {
    name: "Kabir",
    email: "kabir@district.test",
    role: "DISTRICT",
    blurb: "District officer",
  },
  {
    name: "Neha",
    email: "neha@quality.test",
    role: "QUALITY",
    blurb: "Quality team",
  },
  {
    name: "Farah",
    email: "farah@state.test",
    role: "STATE",
    blurb: "State office",
  },
];

export const DEMO_PASSWORD = "password123";
