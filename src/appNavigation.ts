export const NAV_SESSION_KEY = "s3_erp_nav_state";
export const NAV_LOCAL_KEY = "s3_erp_nav_state_local";

export const DEFAULT_POST_LOGIN_NAV = {
  activeTab: "ACCOUNTING",
  activeSubTab: "Review Requisitions",
} as const;

export const getPostLoginNavigation = () => ({ ...DEFAULT_POST_LOGIN_NAV });
