import { useQueryClient } from "@tanstack/react-query";
import { useCallback, type MouseEvent } from "react";
import { useLocation } from "react-router-dom";

export function useTabReselect() {
  const location = useLocation();
  const queryClient = useQueryClient();

  return useCallback(
    (to: string) => (event: MouseEvent<HTMLAnchorElement>) => {
      const isCurrent = to === "/" ? location.pathname === "/" : location.pathname === to;
      if (!isCurrent) {
        return;
      }

      event.preventDefault();

      if (window.scrollY > 0) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        void queryClient.refetchQueries({ type: "active" });
      }
    },
    [location.pathname, queryClient]
  );
}
