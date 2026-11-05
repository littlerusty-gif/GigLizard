import React from "react";
import PrivacyPolicyPage from "./PrivacyPolicyPage";

export interface PrivacyPolicyProps {
  onSelectTab?: (tab: any, pushToHistory?: boolean) => void;
}

export function PrivacyPolicy({ onSelectTab }: PrivacyPolicyProps) {
  return <PrivacyPolicyPage onSelectTab={onSelectTab} />;
}

export default PrivacyPolicy;
