import { AvailableBand } from "../types";
import { 
  AUTHENTIC_AVAILABLE_BANDS, 
  INITIAL_AVAILABLE_BANDS, 
  sanitizeBand, 
  sanitizeBandPhoneNumber, 
  isAuthenticBand 
} from "./availableBands";

/**
 * Filtered, authentic bands list containing only genuine musical acts with verified
 * contact/presence channels and sanitized phone numbers.
 */
export const MOCK_BANDS: AvailableBand[] = AUTHENTIC_AVAILABLE_BANDS;
export const AUTHENTIC_BANDS: AvailableBand[] = AUTHENTIC_AVAILABLE_BANDS;

export { 
  AUTHENTIC_AVAILABLE_BANDS, 
  INITIAL_AVAILABLE_BANDS, 
  sanitizeBand, 
  sanitizeBandPhoneNumber, 
  isAuthenticBand 
};

export default AUTHENTIC_AVAILABLE_BANDS;
