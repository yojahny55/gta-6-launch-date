/**
 * Delete Form Client-Side Logic
 * Story 4.6: GDPR Data Deletion Request Form
 *
 * Handles form validation, submission, and UI state management for deletion requests.
 */

// UUID v4 validation regex (matches cookie ID format)
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Initialize the deletion form
 */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('deletion-form');
  const cookieIdInput = document.getElementById('cookie-id');
  const confirmCheckbox = document.getElementById('confirm');
  const submitBtn = document.getElementById('submit-btn');
  const retryBtn = document.getElementById('retry-btn');

  // Auto-populate cookie ID if it exists
  const existingCookieId = Cookies.get('gta6_user_id');
  if (existingCookieId && UUID_V4_REGEX.test(existingCookieId)) {
    cookieIdInput.value = existingCookieId;
    cookieIdInput.readOnly = true;
    cookieIdInput.classList.add('input-success');
  }

  // Real-time cookie ID validation
  cookieIdInput.addEventListener('blur', () => {
    validateCookieID(cookieIdInput.value);
  });

  // Form submission
  form.addEventListener('submit', handleFormSubmit);

  // Retry button
  retryBtn.addEventListener('click', () => {
    showContainer('form-container');
  });
});


/**
 * Validate cookie ID format (UUID v4)
 * @param {string} cookieId - Cookie ID to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateCookieID(cookieId) {
  const cookieIdInput = document.getElementById('cookie-id');
  const errorSpan = document.getElementById('cookie-id-error');

  if (!cookieId || !cookieId.trim()) {
    showError('cookie-id', 'Cookie ID is required');
    cookieIdInput.classList.remove('input-success');
    cookieIdInput.classList.add('input-error');
    return false;
  }

  if (!UUID_V4_REGEX.test(cookieId)) {
    showError('cookie-id', 'Invalid cookie ID format (must be UUID v4)');
    cookieIdInput.classList.remove('input-success');
    cookieIdInput.classList.add('input-error');
    return false;
  }

  // Valid
  clearError('cookie-id');
  cookieIdInput.classList.remove('input-error');
  cookieIdInput.classList.add('input-success');
  return true;
}


/**
 * Show validation error for a field
 * @param {string} fieldName - Name of the field (cookie-id, email, confirm)
 * @param {string} message - Error message
 */
function showError(fieldName, message) {
  const errorSpan = document.getElementById(`${fieldName}-error`);
  if (errorSpan) {
    errorSpan.textContent = message;
    errorSpan.classList.remove('hidden');
  }
}

/**
 * Clear validation error for a field
 * @param {string} fieldName - Name of the field
 */
function clearError(fieldName) {
  const errorSpan = document.getElementById(`${fieldName}-error`);
  if (errorSpan) {
    errorSpan.textContent = '';
    errorSpan.classList.add('hidden');
  }
}

/**
 * Handle form submission
 * @param {Event} e - Form submit event
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  const cookieIdInput = document.getElementById('cookie-id');
  const reasonSelect = document.getElementById('reason');
  const confirmCheckbox = document.getElementById('confirm');

  // Clear all errors
  clearError('cookie-id');
  clearError('confirm');

  // Validate all fields
  const isCookieIdValid = validateCookieID(cookieIdInput.value);

  if (!confirmCheckbox.checked) {
    showError('confirm', 'You must confirm this action is permanent');
    return;
  }

  if (!isCookieIdValid) {
    return; // Stop if validation fails
  }

  // Prepare request data
  const requestData = {
    cookie_id: cookieIdInput.value.trim(),
    confirm: confirmCheckbox.checked,
  };

  // Add optional reason if provided
  if (reasonSelect.value) {
    requestData.reason = reasonSelect.value;
  }

  // Disable submit button
  const submitBtn = document.getElementById('submit-btn');
  const submitBtnText = document.getElementById('submit-btn-text');
  submitBtn.disabled = true;
  submitBtnText.textContent = 'Submitting...';
  submitBtn.classList.add('loading');

  try {
    // Submit deletion request
    const response = await fetch('/api/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Success - show success message
      document.getElementById('success-message').textContent = 'Your data has been deleted successfully.';
      showContainer('success-container');
    } else {
      // Error - show error message
      const errorMessage = data.error?.message || 'An unexpected error occurred. Please try again.';
      document.getElementById('error-message').textContent = errorMessage;
      showContainer('error-container');
    }
  } catch (error) {
    console.error('Deletion request failed:', error);
    document.getElementById('error-message').textContent = 'Network error. Please check your connection and try again.';
    showContainer('error-container');
  } finally {
    // Re-enable submit button
    submitBtn.disabled = false;
    submitBtnText.textContent = 'Delete My Data';
    submitBtn.classList.remove('loading');
  }
}

/**
 * Show a specific container and hide others
 * @param {string} containerToShow - ID of the container to show
 */
function showContainer(containerToShow) {
  const containers = ['form-container', 'success-container', 'error-container'];
  containers.forEach((containerId) => {
    const container = document.getElementById(containerId);
    if (container) {
      if (containerId === containerToShow) {
        container.classList.remove('hidden');
      } else {
        container.classList.add('hidden');
      }
    }
  });
}
