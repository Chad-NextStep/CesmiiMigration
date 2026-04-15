/**
 * contact.js — HubSpot form initialization
 */

(function () {
  // Set this to your HubSpot form ID
  const CONTACT_FORM_ID = 'YOUR_FORM_ID';

  document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('hubspot-form');
    showLoading(container);

    try {
      await createHubSpotForm({
        formId: CONTACT_FORM_ID,
        targetId: 'hubspot-form',
      });
      // The HubSpot script replaces the container content
    } catch (err) {
      console.error('Contact form error:', err);
      showError(container, 'Could not load the contact form. Please try again later.');
    }
  });
})();
