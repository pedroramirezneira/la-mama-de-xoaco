import {setGlobalOptions} from "firebase-functions";
import {
  beforeUserCreated,
  HttpsError,
} from "firebase-functions/v2/identity";

setGlobalOptions({maxInstances: 10});

const AUSTRAL_DOMAIN = "austral.edu.ar";

/**
 * Checks whether an email belongs to Austral or one of its subdomains.
 *
 * @param {string | undefined} email Email address to validate.
 * @return {boolean} Whether the email has an allowed domain.
 */
function hasAustralEmailDomain(email: string | undefined): boolean {
  if (!email) {
    return false;
  }

  const atIndex = email.lastIndexOf("@");
  if (atIndex === -1) {
    return false;
  }

  const domain = email.slice(atIndex + 1).toLowerCase();

  return domain === AUSTRAL_DOMAIN || domain.endsWith(`.${AUSTRAL_DOMAIN}`);
}

export const beforeCreate = beforeUserCreated((event) => {
  if (!hasAustralEmailDomain(event.data?.email)) {
    throw new HttpsError(
      "invalid-argument",
      "Registration requires an austral.edu.ar email address or subdomain.",
    );
  }
});
