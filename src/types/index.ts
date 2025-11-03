export type user = {
  id?: string;
  userId?: string;
  action: "create" | "update" | "delete";
  role?: string;
};
