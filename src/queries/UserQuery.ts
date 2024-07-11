import { TESTING_USER_UUID } from "@/data-model/user/UserType";
import { database } from "@/infras/database";
import { useQuery } from "@tanstack/react-query";

export const ACTIVE_USER_QUERY_KEY = "active-user";

export const useActiveUser = () =>
  useQuery({
    queryKey: [ACTIVE_USER_QUERY_KEY],
    queryFn: async () => await database.user.findById(TESTING_USER_UUID),
  });
