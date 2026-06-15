const CLIENT_ID_KEY = "feedback_loop_client_id";

function submissionKey(businessName: string) {
  return `feedback_loop_submitted_${businessName.trim().toLowerCase()}`;
}

export function getOrCreateClientId() {
  const existing = localStorage.getItem(CLIENT_ID_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  localStorage.setItem(CLIENT_ID_KEY, id);
  return id;
}

export function hasSubmittedFeedback(businessName: string) {
  if (!businessName.trim()) return false;
  return localStorage.getItem(submissionKey(businessName)) === "1";
}

export function markFeedbackSubmitted(businessName: string) {
  if (!businessName.trim()) return;
  localStorage.setItem(submissionKey(businessName), "1");
}
