import React, { useState, useEffect } from "react";
import { UserAccount, AvailableBand, Venue } from "../types";
import { sanitizeInputText } from "../utils/antiScrape";
import { isBandBanned, isPerpetualPassEmail } from "../utils/accessControl";
import { getCachedProfiles, fetchProfiles, insertProfile, supabase, resolveAccountFromDatabase, linkAuthUidToBand, saveBandToDatabase } from "../lib/supabase";
import { recordLiveSignup } from "../utils/analyticsStore";
import { 
  X, Lock, LogIn, Eye, EyeOff, CheckCircle2, 
  AlertCircle, KeyRound, ShieldCheck, UserCheck,
  UserPlus, Headphones, Users, Building, Send, RefreshCw, ArrowLeft
} from "lucide-react";

interface UserLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (account: UserAccount) => void;
  onOpenCheckout?: () => void;
  initialMode?: "login" | "signup" | "forgot";
  initialEmail?: string;
}

export default function UserLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  onOpenCheckout,
  initialMode = "login",
  initialEmail = ""
}: UserLoginModalProps) {
  const [loginEmail, setLoginEmail] = useState(initialEmail);
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginRole, setLoginRole] = useState<"Band" | "Venue" | "Sound Engineer">("Venue");
  const [modalMode, setModalMode] = useState<"login" | "signup" | "forgot">(initialMode);
  const [signupName, setSignupName] = useState("");
  const [signupCity, setSignupCity] = useState("Seattle, WA");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Forgot password request state
  const [forgotEmail, setForgotEmail] = useState(initialEmail);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Anti-bot captcha challenge
  const [captchaNumA, setCaptchaNumA] = useState(3);
  const [captchaNumB, setCaptchaNumB] = useState(4);
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaVerified, setCaptchaVerified] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage("");
      setSuccessMessage("");
      setResetEmailSent(false);
      if (initialMode) {
        setModalMode(initialMode);
      }
      if (initialEmail) {
        setLoginEmail(initialEmail);
        setForgotEmail(initialEmail);
      }
      const a = Math.floor(Math.random() * 8) + 2;
      const b = Math.floor(Math.random() * 8) + 2;
      setCaptchaNumA(a);
      setCaptchaNumB(b);
      setCaptchaInput("");
      setCaptchaVerified(false);
    }
  }, [isOpen, initialMode, initialEmail]);

  const handleVerifyCaptcha = () => {
    if (parseInt(captchaInput.trim(), 10) === captchaNumA + captchaNumB) {
      setCaptchaVerified(true);
      setErrorMessage("");
    } else {
      setErrorMessage("Anti-bot verification failed. Please check the math answer.");
    }
  };

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!captchaVerified) {
      if (parseInt(captchaInput.trim(), 10) === captchaNumA + captchaNumB) {
        setCaptchaVerified(true);
      } else {
        setErrorMessage("Anti-bot check required: Please solve the quick math verification below.");
        return;
      }
    }

    const cleanEmail = sanitizeInputText(forgotEmail || loginEmail, 100).trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsSendingReset(true);
    try {
      const redirectUrl = window.location.origin || window.location.href;
      let { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });

      // Handle redirect validation error gracefully (e.g. "Invalid path specified in request URL")
      if (error) {
        const errLower = (error.message || "").toLowerCase();
        const isRedirectError =
          errLower.includes("invalid path") ||
          errLower.includes("redirect") ||
          errLower.includes("request url");

        if (isRedirectError) {
          // Retry without redirectTo as fallback or proceed gracefully without blocking the user
          try {
            const fallbackRes = await supabase.auth.resetPasswordForEmail(cleanEmail);
            if (!fallbackRes.error) {
              error = null;
            }
          } catch {
            // Ignore fallback network error and do not block the user
          }
        }
      }

      if (error) {
        const errLower = (error.message || "").toLowerCase();
        if (errLower.includes("invalid path") || errLower.includes("redirect")) {
          // Do not block the user with an unhandled exception or redirect validation error
          setResetEmailSent(true);
          setSuccessMessage("If an account exists for this email, a recovery message has been sent.");
        } else {
          setErrorMessage(error.message || "Failed to dispatch recovery link. Please try again.");
        }
      } else {
        setResetEmailSent(true);
        setSuccessMessage("If an account exists for this email, a recovery message has been sent.");
      }
    } catch (err: any) {
      const msg = (err?.message || "").toLowerCase();
      if (msg.includes("invalid path") || msg.includes("redirect")) {
        setResetEmailSent(true);
        setSuccessMessage("If an account exists for this email, a recovery message has been sent.");
      } else {
        setErrorMessage(err?.message || "Failed to contact Supabase Auth service.");
      }
    } finally {
      setIsSendingReset(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!captchaVerified) {
      if (parseInt(captchaInput.trim(), 10) === captchaNumA + captchaNumB) {
        setCaptchaVerified(true);
      } else {
        setErrorMessage("Anti-bot check required: Please solve the quick math verification below.");
        return;
      }
    }

    const cleanEmail = sanitizeInputText(loginEmail, 100).trim().toLowerCase();
    const cleanPassword = sanitizeInputText(loginPassword, 100);

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!cleanPassword) {
      setErrorMessage("Please enter your password.");
      return;
    }

    if (modalMode === "signup" && !signupName.trim()) {
      setErrorMessage("Please enter your name (Band Name, Venue Name, or Audio Tech Name).");
      return;
    }

    if (isBandBanned(cleanEmail)) {
      setErrorMessage("Access denied: This account has been banned from the directory.");
      return;
    }

    // Check custom passwords map
    const customPasswordsMap: Record<string, string> = (() => {
      try {
        return JSON.parse(localStorage.getItem("user_custom_passwords_v1") || "{}");
      } catch {
        return {};
      }
    })();
    const expectedCustomPass = customPasswordsMap[cleanEmail];

    // 0. Attempt authentic Supabase Auth sign-in first for registered users
    if (modalMode === "login") {
      try {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (!signInError && signInData?.user) {
          // Explicitly link auth.uid() to user_id in public.bands matching official_email
          await linkAuthUidToBand(signInData.user.id, signInData.user.email || cleanEmail);

          // Prioritize database name from public.bands then public.profiles
          const resolved = await resolveAccountFromDatabase(signInData.user.id, signInData.user.email || cleanEmail);
          const isVip = cleanEmail === 'giglizard.us@gmail.com' || isPerpetualPassEmail(cleanEmail) || resolved.isOwner;
          const roleType = (resolved.role || "Band") as "Band" | "Venue" | "Sound Engineer";
          const finalName = resolved.isOwner || cleanEmail === "littlerusty@gmail.com" ? "Dr Hadit" : resolved.name;

          const payload: UserAccount = {
            id: resolved.bandRecord?.id || resolved.profileRecord?.id || signInData.user.id,
            email: cleanEmail,
            role: roleType,
            type: roleType,
            name: finalName,
            city: resolved.city,
            isPremium: Boolean(resolved.profileRecord?.is_premium || resolved.profileRecord?.is_paid || isVip),
            hasPaidAccess: Boolean(resolved.profileRecord?.is_paid || resolved.profileRecord?.is_premium || isVip),
            autoRenew: Boolean(resolved.profileRecord?.auto_renew ?? true),
            accessExpiresAt: resolved.profileRecord?.access_expires_at || (isVip ? new Date(Date.now() + 36500 * 24 * 60 * 60 * 1000).toISOString() : undefined),
            contactEmail: cleanEmail,
            genre: Array.isArray(resolved.bandRecord?.genres) 
              ? resolved.bandRecord.genres.join(", ") 
              : (resolved.bandRecord?.genres || resolved.profileRecord?.genres || resolved.profileRecord?.genre || undefined),
            bio: resolved.bandRecord?.bio || resolved.profileRecord?.bio || undefined,
            website: resolved.bandRecord?.website || resolved.profileRecord?.website || resolved.profileRecord?.primary_link || undefined,
            musicUrl: resolved.bandRecord?.music_url || resolved.profileRecord?.music_url || undefined,
            epkUrl: resolved.bandRecord?.epk_url || resolved.profileRecord?.epk_url || undefined,
            contactPhone: resolved.profileRecord?.phone || undefined,
            experienceLevel: resolved.bandRecord?.touring_tier
              ? (resolved.bandRecord.touring_tier.includes("National") ? "National Act" : resolved.bandRecord.touring_tier.includes("Regional") ? "Regional Tour" : "Local")
              : ((resolved.profileRecord?.experience_level as any) || "Local")
          };

          try {
            localStorage.setItem("current_user_account_v1", JSON.stringify(payload));
            localStorage.removeItem("giglizard_active_user");
          } catch (_) {}

          setSuccessMessage(`✅ Welcome back! Logged in as ${roleType}: ${payload.name}.`);
          setTimeout(() => {
            onLoginSuccess(payload);
            onClose();
          }, 600);
          return;
        }
      } catch (_) {}
    }

    // 1. Platform Owner (littlerusty@gmail.com)
    if (cleanEmail === "littlerusty@gmail.com") {
      const validAdminPass = expectedCustomPass || "L,eilani1228";
      if (cleanPassword === validAdminPass) {
        const ownerAccount: UserAccount = {
          id: "41c6fde8-9462-4402-a0f1-79155786fb03",
          email: "littlerusty@gmail.com",
          role: "Band",
          type: "Band",
          name: "Dr Hadit", // Explicitly ensure Dr Hadit, never email prefix or stale cache
          city: "Seattle, WA",
          isPremium: true,
          hasPaidAccess: true,
          autoRenew: true,
          accessExpiresAt: new Date(Date.now() + 36500 * 24 * 60 * 60 * 1000).toISOString(),
          contactEmail: "littlerusty@gmail.com",
          genre: "Alternative Rock / Synthwave",
          bio: "Platform Owner & Artist (Dr Hadit) • Lifetime VIP Owner with full unmasked access for life.",
          experienceLevel: "National Act"
        };
        linkAuthUidToBand(ownerAccount.id, "littlerusty@gmail.com").catch(() => {});
        try {
          localStorage.setItem("current_user_account_v1", JSON.stringify(ownerAccount));
          localStorage.removeItem("giglizard_active_user");
        } catch (_) {}
        setSuccessMessage("✅ Logged in successfully as Platform Owner! Lifetime Full Access Enabled.");
        setTimeout(() => {
          onLoginSuccess(ownerAccount);
          onClose();
        }, 600);
        return;
      } else {
        setErrorMessage("Invalid password for Platform Owner account.");
        return;
      }
    }

    if (cleanPassword.length < 4) {
      setErrorMessage("Password must be at least 4 characters.");
      return;
    }

    // 2. Check registered custom bands & venues in localStorage
    const savedBandsStr = localStorage.getItem("custom_available_bands_v1");
    let customBands: any[] = [];
    if (savedBandsStr) {
      try { customBands = JSON.parse(savedBandsStr); } catch (_) {}
    }

    const savedVenuesStr = localStorage.getItem("custom_venues_v1");
    let customVenues: any[] = [];
    if (savedVenuesStr) {
      try { customVenues = JSON.parse(savedVenuesStr); } catch (_) {}
    }

    const foundCustomBand = customBands.find(b => 
      b.contactEmail?.trim().toLowerCase() === cleanEmail ||
      b.name?.trim().toLowerCase() === cleanEmail
    );
    if (foundCustomBand) {
      const requiredPass = expectedCustomPass || foundCustomBand.password || "password";
      if (cleanPassword !== requiredPass) {
        setErrorMessage("Access denied: Incorrect password for registered band account.");
        return;
      }
      const payload: UserAccount = {
        type: "Band",
        name: foundCustomBand.name,
        city: foundCustomBand.city,
        isPremium: Boolean(foundCustomBand.isPremium),
        hasPaidAccess: Boolean(foundCustomBand.hasPaidAccess),
        accessExpiresAt: foundCustomBand.accessExpiresAt,
        contactEmail: foundCustomBand.contactEmail,
        genre: Array.isArray(foundCustomBand.genres) ? foundCustomBand.genres.join(", ") : (foundCustomBand.genre || "Alternative Rock"),
        bio: foundCustomBand.bio,
        experienceLevel: foundCustomBand.experienceLevel,
        website: foundCustomBand.website,
        contactPhone: foundCustomBand.contactPhone,
        password: requiredPass
      };
      setSuccessMessage(`✅ Welcome back! Logged in as Band: ${foundCustomBand.name}.`);
      setTimeout(() => {
        onLoginSuccess(payload);
        onClose();
      }, 600);
      return;
    }

    const foundCustomVenue = customVenues.find(v => 
      v.contactEmail?.trim().toLowerCase() === cleanEmail ||
      v.name?.trim().toLowerCase() === cleanEmail
    );
    if (foundCustomVenue) {
      const requiredPass = expectedCustomPass || foundCustomVenue.password || "password";
      if (cleanPassword !== requiredPass) {
        setErrorMessage("Access denied: Incorrect password for registered venue account.");
        return;
      }
      const payload: UserAccount = {
        type: "Venue",
        name: foundCustomVenue.name,
        city: foundCustomVenue.city,
        isPremium: Boolean(foundCustomVenue.isPremium),
        hasPaidAccess: Boolean(foundCustomVenue.hasPaidAccess),
        accessExpiresAt: foundCustomVenue.accessExpiresAt,
        contactEmail: foundCustomVenue.contactEmail,
        genre: Array.isArray(foundCustomVenue.genres) ? foundCustomVenue.genres.join(", ") : "Live Music",
        bio: foundCustomVenue.description,
        capacity: foundCustomVenue.capacity,
        address: foundCustomVenue.address,
        hasPA: foundCustomVenue.hasPA,
        hasLighting: foundCustomVenue.hasLighting,
        contactPhone: foundCustomVenue.contactPhone,
        website: foundCustomVenue.website,
        password: requiredPass
      };
      setSuccessMessage(`✅ Welcome back! Logged in as Venue: ${foundCustomVenue.name}.`);
      setTimeout(() => {
        onLoginSuccess(payload);
        onClose();
      }, 600);
      return;
    }

    // 3. Check registered Supabase profiles cache (with live query fallback)
    let cachedProfiles = getCachedProfiles();
    let foundProfile = cachedProfiles.find(p =>
      (p.contact_email || p.email)?.trim().toLowerCase() === cleanEmail ||
      p.name?.trim().toLowerCase() === cleanEmail
    );
    if (!foundProfile) {
      try {
        const liveProfiles = await fetchProfiles();
        cachedProfiles = liveProfiles;
        foundProfile = liveProfiles.find(p =>
          (p.contact_email || p.email)?.trim().toLowerCase() === cleanEmail ||
          p.name?.trim().toLowerCase() === cleanEmail
        );
      } catch (_) {}
    }

    if (foundProfile) {
      const requiredPass = expectedCustomPass || foundProfile.password || "password";
      if (cleanPassword !== requiredPass && cleanPassword.length < 4) {
        setErrorMessage("Access denied: Incorrect password for registered account.");
        return;
      }
      const roleType = (foundProfile.type || foundProfile.role || "Band") as "Band" | "Venue" | "Sound Engineer";
      const payload: UserAccount = {
        type: roleType,
        name: foundProfile.name,
        city: foundProfile.city,
        isPremium: Boolean(foundProfile.is_premium),
        hasPaidAccess: Boolean(foundProfile.is_paid || foundProfile.is_premium),
        contactEmail: foundProfile.contact_email || foundProfile.email || cleanEmail,
        genre: foundProfile.genre || undefined,
        bio: foundProfile.bio || undefined,
        capacity: foundProfile.capacity ? Number(foundProfile.capacity) : undefined,
        address: foundProfile.address || undefined,
        hasPA: foundProfile.has_pa ?? undefined,
        hasLighting: foundProfile.has_lighting ?? undefined,
        contactPhone: foundProfile.contact_phone || foundProfile.phone || undefined,
        website: foundProfile.website || undefined,
        password: requiredPass
      };
      setSuccessMessage(`✅ Welcome back! Logged in as ${roleType}: ${foundProfile.name}.`);
      setTimeout(() => {
        onLoginSuccess(payload);
        onClose();
      }, 600);
      return;
    }

    // 4. Check previously active profile in venue_user_profile_v1
    const storedVenueProfileStr = localStorage.getItem("venue_user_profile_v1");
    if (storedVenueProfileStr) {
      try {
        const storedProfile: UserAccount = JSON.parse(storedVenueProfileStr);
        if (storedProfile.contactEmail?.trim().toLowerCase() === cleanEmail) {
          setSuccessMessage(`✅ Logged in successfully as: ${storedProfile.name || cleanEmail}`);
          setTimeout(() => {
            onLoginSuccess(storedProfile);
            onClose();
          }, 600);
          return;
        }
      } catch (_) {}
    }

    // If modal is in 'login' mode and no account was matched, inform the user to switch to sign-up
    if (modalMode === "login") {
      setErrorMessage("No existing account found with this email. Please check your credentials or click 'Sign Up Free' above to register.");
      return;
    }

    // 5. User registration / sign up for new account
    let displayName = cleanEmail.split("@")[0];
    displayName = displayName.split(/[\s._-]+/).map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join(" ");

    const finalName = modalMode === "signup" && signupName.trim()
      ? signupName.trim()
      : (loginRole === "Venue" ? `${displayName} Room` : (loginRole === "Sound Engineer" ? `${displayName} Audio Tech` : displayName));

    const finalCity = modalMode === "signup" && signupCity.trim()
      ? signupCity.trim()
      : "Seattle, WA";

    if (modalMode === "signup") {
      if (cleanPassword.length < 6) {
        setErrorMessage("Password must be at least 6 characters long.");
        return;
      }

      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            data: {
              role: loginRole,
              name: finalName,
            }
          }
        });

        if (authError) {
          const errLower = authError.message.toLowerCase();
          if (errLower.includes("already registered") || errLower.includes("already in use") || errLower.includes("unique")) {
            setErrorMessage(`An account with the email "${cleanEmail}" is already registered. Please sign in or use "Forgot Password".`);
            return;
          }
          if (errLower.includes("password")) {
            setErrorMessage(authError.message || "Password is too short. Please use at least 6 characters.");
            return;
          }
          setErrorMessage(authError.message);
          return;
        }

        if (authData?.user && authData.user.identities && authData.user.identities.length === 0) {
          setErrorMessage(`An account with the email "${cleanEmail}" is already registered. Please sign in or use "Forgot Password".`);
          return;
        }

        // Link profile and bands with auth UID
        if (authData?.user) {
          // Explicitly link auth.uid() to user_id in public.bands
          await linkAuthUidToBand(authData.user.id, cleanEmail);

          // If registering as a Band, save directly to public.bands
          if (loginRole === "Band") {
            try {
              await saveBandToDatabase({
                name: finalName,
                city_state: finalCity,
                official_email: cleanEmail,
                user_id: authData.user.id,
                genres: ["Alternative Rock"],
                bio: `${finalName} is a live music artist registered on GigLizard.`,
                touring_tier: "Local Support (Opening & Regional support)"
              });
            } catch (_) {}
          }

          const profilePayload: any = {
            id: authData.user.id,
            email: cleanEmail,
            name: finalName,
            role: loginRole,
            city: finalCity,
            genres: loginRole === "Venue" ? "Live Music" : (loginRole === "Sound Engineer" ? "FOH, Monitors, Studio" : "Alternative Rock"),
            bio: `${loginRole} profile registered on GigLizard.`,
            phone: '',
            website: '',
            epk_link: '',
            touring_status: 'Local',
            created_at: new Date().toISOString()
          };

          const { error: profileError } = await supabase
            .from('profiles')
            .upsert(profilePayload);

          if (profileError && (profileError.message?.toLowerCase().includes("column") || profileError.code === "PGRST204")) {
            await supabase.from('profiles').upsert({
              id: authData.user.id,
              email: cleanEmail,
              name: finalName,
              role: loginRole,
              city: finalCity,
              genres: profilePayload.genres,
              bio: profilePayload.bio,
              created_at: new Date().toISOString()
            });
          }
        }

        // If email confirmation is required by Supabase
        if (!authData?.session) {
          setSuccessMessage("Account created! Please check your email to confirm your account before logging in.");
          return;
        }
      } catch (err: any) {
        setErrorMessage(err?.message || "Registration failed. Please try again.");
        return;
      }
    }

    // Await insertProfile() to persist directly into Supabase 'profiles' table
    try {
      await insertProfile({
        name: finalName,
        email: cleanEmail,
        role: loginRole,
        type: loginRole,
        city: finalCity,
        genres: loginRole === "Venue" ? "Live Music" : (loginRole === "Sound Engineer" ? "FOH, Monitors, Studio" : "Alternative Rock"),
        bio: `${loginRole} profile registered on GigLizard.`
      });
    } catch (err) {
      console.warn("[Supabase] Failed to insert profile during sign up:", err);
    }

    // Immediately push new record into global directory state
    if (loginRole === "Band") {
      try {
        const saved = localStorage.getItem("custom_available_bands_v1");
        const list: AvailableBand[] = saved ? JSON.parse(saved) : [];
        const newBand: AvailableBand = {
          id: `band-reg-${Date.now()}`,
          name: finalName,
          genres: ["Alternative Rock"],
          city: finalCity,
          bio: "Live music artist registered on GigLizard.",
          contactEmail: cleanEmail,
          experienceLevel: "Local"
        };
        localStorage.setItem("custom_available_bands_v1", JSON.stringify([newBand, ...list.filter(b => b.contactEmail !== cleanEmail)]));
        window.dispatchEvent(new CustomEvent("giglizard_bands_updated"));
      } catch (err) {
        console.warn("Failed pushing band to global directory state:", err);
      }
    } else if (loginRole === "Venue") {
      try {
        const saved = localStorage.getItem("custom_venues_v1");
        const list: Venue[] = saved ? JSON.parse(saved) : [];
        const newVenue: Venue = {
          id: `venue-reg-${Date.now()}`,
          name: finalName,
          capacity: 150,
          address: finalCity,
          city: finalCity,
          genres: ["Live Music"],
          contactEmail: cleanEmail,
          contactPhone: "Inquire",
          description: "Live music performance space.",
          website: "www.inquire-booking.com",
          hasPA: true,
          hasLighting: true
        };
        localStorage.setItem("custom_venues_v1", JSON.stringify([newVenue, ...list.filter(v => v.contactEmail !== cleanEmail)]));
        window.dispatchEvent(new CustomEvent("giglizard_venues_updated"));
      } catch (err) {
        console.warn("Failed pushing venue to global directory state:", err);
      }
    }

    // Record signup in analytics subscriber directory
    recordLiveSignup({
      name: finalName,
      contactEmail: cleanEmail,
      type: loginRole,
      city: finalCity,
      isPaid: false,
      plan: "Free Community Member",
      notes: `${loginRole} account registered on GigLizard.`
    });

    // Immediately broadcast subscriber update to sync admin counters
    window.dispatchEvent(new CustomEvent("giglizard_subscribers_updated"));

    // Save custom password in local credentials store
    try {
      const passwordsMap = JSON.parse(localStorage.getItem("user_custom_passwords_v1") || "{}");
      passwordsMap[cleanEmail] = cleanPassword;
      localStorage.setItem("user_custom_passwords_v1", JSON.stringify(passwordsMap));
    } catch (_) {}

    const defaultAccount: UserAccount = {
      type: loginRole,
      name: finalName,
      city: finalCity,
      isPremium: false,
      hasPaidAccess: false,
      contactEmail: cleanEmail,
      genre: loginRole === "Venue" ? "Live Music" : (loginRole === "Sound Engineer" ? "Front of House / Audio" : "Alternative Rock"),
      bio: `${loginRole} account registered on GigLizard.`,
      password: cleanPassword
    };

    setSuccessMessage(`✅ Registered & signed in as: ${defaultAccount.name}`);
    setTimeout(() => {
      onLoginSuccess(defaultAccount);
      onClose();
    }, 600);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      id="user-login-modal-overlay"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 md:p-7 space-y-5 shadow-2xl relative animate-scale-up text-white"
        onClick={(e) => e.stopPropagation()}
        id="user-login-modal-content"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all cursor-pointer"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Mode Toggle */}
        <div className="text-center space-y-2 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-inner">
            {modalMode === "signup" ? (
              <UserPlus className="w-6 h-6" />
            ) : modalMode === "forgot" ? (
              <KeyRound className="w-6 h-6 text-amber-400" />
            ) : (
              <Lock className="w-6 h-6" />
            )}
          </div>
          <h3 className="text-xl font-black text-white tracking-tight">
            {modalMode === "signup"
              ? "Create Free Account Profile"
              : modalMode === "forgot"
              ? "Reset Account Password"
              : "Account Sign In Required"}
          </h3>
          <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
            {modalMode === "signup"
              ? "Register your band, venue room, or sound engineering tech profile into the shared directory."
              : modalMode === "forgot"
              ? "Enter your account email to receive a secure recovery link dispatched directly from Supabase Auth."
              : "Band contact information is reserved for logged-in users with an active, up-to-date paid subscription."}
          </p>

          {/* Mode Switcher Tabs */}
          {modalMode !== "forgot" ? (
            <div className="flex items-center justify-center p-1 bg-slate-950 border border-slate-800 rounded-xl max-w-xs mx-auto mt-2">
              <button
                type="button"
                onClick={() => {
                  setModalMode("login");
                  setErrorMessage("");
                }}
                className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  modalMode === "login"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalMode("signup");
                  setErrorMessage("");
                }}
                className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  modalMode === "signup"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign Up Free</span>
              </button>
            </div>
          ) : (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setModalMode("login");
                  setErrorMessage("");
                  setSuccessMessage("");
                  setResetEmailSent(false);
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Account Sign In</span>
              </button>
            </div>
          )}
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/50 border border-rose-500/50 rounded-xl flex items-start gap-2.5 text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-950/50 border border-emerald-500/50 rounded-xl flex items-center gap-2.5 text-xs text-emerald-200 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* FORGOT PASSWORD REQUEST VIEW: Official Supabase Auth Email Recovery */}
        {modalMode === "forgot" ? (
          resetEmailSent ? (
            <div className="p-5 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl space-y-4 text-center animate-fade-in" id="forgot-password-sent-view">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Recovery Email Dispatched</h4>
                <p className="text-xs text-emerald-200 leading-relaxed">
                  If an account exists for this email, a recovery message has been sent.
                </p>
              </div>
              <p className="text-[11px] text-slate-400">
                Clicking the link in your email will securely prompt you to enter a new password.
              </p>
              <button
                type="button"
                onClick={() => {
                  setModalMode("login");
                  setErrorMessage("");
                  setSuccessMessage("");
                  setResetEmailSent(false);
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleRequestPasswordReset} className="space-y-3.5" id="forgot-password-request-form">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Account Email Address *
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => {
                    setForgotEmail(e.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="e.g. booking@myband.com"
                  required
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-all font-mono"
                />
              </div>

              {/* Anti-bot Math Challenge */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    Security Verification:
                  </span>
                  <span className="font-mono text-amber-400 font-black">
                    {captchaNumA} + {captchaNumB} = ?
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    placeholder="Enter answer"
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyCaptcha}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      captchaVerified 
                        ? "bg-emerald-600 text-white" 
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    }`}
                  >
                    {captchaVerified ? "✓ Verified" : "Verify"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSendingReset}
                onClick={() => setErrorMessage("")}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 mt-2"
                id="btn-send-reset-link"
              >
                {isSendingReset ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending Recovery Link...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Reset Link</span>
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setModalMode("login");
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Cancel & Back to Sign In</span>
                </button>
              </div>
            </form>
          )
        ) : (
          /* REGULAR LOGIN / SIGNUP FORM */
          <form onSubmit={handleSubmitLogin} className="space-y-3.5">
          {/* Sign Up Name Field */}
          {modalMode === "signup" && (
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {loginRole === "Band" ? "Band / Artist Name" : (loginRole === "Venue" ? "Venue Name" : "Sound Engineer Name")} *
              </label>
              <input
                type="text"
                value={signupName}
                onChange={(e) => {
                  setSignupName(e.target.value);
                  setErrorMessage("");
                }}
                placeholder={loginRole === "Band" ? "e.g. Pacific Echoes" : (loginRole === "Venue" ? "e.g. Starry Lounge" : "e.g. Dave Sound Tech")}
                required={modalMode === "signup"}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          )}

          {/* Email */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Email Address *
            </label>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => {
                setLoginEmail(e.target.value);
                setErrorMessage("");
              }}
              placeholder="e.g. booking@myband.com"
              required
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-all font-mono"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Password *
              </label>
              {modalMode === "login" ? (
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(loginEmail);
                    setModalMode("forgot");
                    setErrorMessage("");
                    setSuccessMessage("");
                    setResetEmailSent(false);
                  }}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer transition-colors"
                  id="btn-forgot-password-link"
                >
                  Forgot Password?
                </button>
              ) : (
                <span className="text-[10px] text-slate-500">Min 4 characters</span>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={loginPassword}
                onChange={(e) => {
                  setLoginPassword(e.target.value);
                  setErrorMessage("");
                }}
                placeholder="••••••••"
                required
                className="w-full p-2.5 pr-10 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            </div>
          </div>

          {/* Sign Up City Field */}
          {modalMode === "signup" && (
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                City & State
              </label>
              <input
                type="text"
                value={signupCity}
                onChange={(e) => setSignupCity(e.target.value)}
                placeholder="e.g. Seattle, WA"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          )}

          {/* Role selector */}
          <div className="flex justify-between items-center pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Account Role:
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setLoginRole("Band")}
                className={`text-[11px] font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  loginRole === "Band" 
                    ? "bg-indigo-600 text-white shadow-xs" 
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                <Users className="w-3 h-3" />
                <span>Band</span>
              </button>
              <button
                type="button"
                onClick={() => setLoginRole("Venue")}
                className={`text-[11px] font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  loginRole === "Venue" 
                    ? "bg-emerald-600 text-white shadow-xs" 
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                <Building className="w-3 h-3" />
                <span>Venue</span>
              </button>
              <button
                type="button"
                onClick={() => setLoginRole("Sound Engineer")}
                className={`text-[11px] font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  loginRole === "Sound Engineer" 
                    ? "bg-amber-600 text-white shadow-xs" 
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                <Headphones className="w-3 h-3" />
                <span>Engineer</span>
              </button>
            </div>
          </div>

          {/* Anti-bot Math Challenge */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Security Verification:
              </span>
              <span className="font-mono text-amber-400 font-black">
                {captchaNumA} + {captchaNumB} = ?
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Enter answer"
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={handleVerifyCaptcha}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  captchaVerified 
                    ? "bg-emerald-600 text-white" 
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                }`}
              >
                {captchaVerified ? "✓ Verified" : "Verify"}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 mt-2"
          >
            {modalMode === "signup" ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Free {loginRole} Account</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In to Your Account</span>
              </>
            )}
          </button>
        </form>
        )}

        {/* Upgrade / Subscribe Option */}
        <div className="pt-3 border-t border-slate-800/80 text-center space-y-2">
          <p className="text-[11px] text-slate-400">
            Need an active subscription to unmask contact info?
          </p>
          {onOpenCheckout && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCheckout();
              }}
              className="w-full py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Get 30-Day Pass ($9.99)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
