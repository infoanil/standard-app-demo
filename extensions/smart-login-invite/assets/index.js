/**
 * Login Helper for Shopify Public App
 * Provides authentication and session management utilities
 * Class-based implementation
 */

class ShopifyLoginHelper {
    /**
     * Initialize the login helper
     */
    constructor() {
        this.bulkInviteAppSettings = document.querySelector('#bulk_invite_app_settings')?.innerText;
        if (this.bulkInviteAppSettings) {
            this.bulkInviteAppSettings = JSON.parse(this.bulkInviteAppSettings);
        }

        // Class properties will be initialized here
        this.targetElements = {
            "login-form": document.querySelector("[action='/account/login']") || document.querySelector("#customer_login"),
            "passwordField": document.querySelector("[action='/account/login'] [name='customer[password]']"),
            "emailField": document.querySelector("[action='/account/login'] [name='customer[email]']"),
            "submitBtn": document.querySelector("[action='/account/login'] [type='submit']") || document.querySelector("[action='/account/login'] button"),
        }

        // Common form field container classes
        this.formContainerClasses = [
            'form-field', 'field', 'input-wrapper', 'input-group',
            'form-group', 'form-control-wrapper', 'input-field',
            'form__input-wrapper', 'form-input-wrapper'
        ];

        // Specific password field container classes
        this.passwordContainerClasses = [
            'password-field', 'password-wrapper', 'password-container'
        ];

        // Default messages
        this.messages = {
            invitationSent: this.bulkInviteAppSettings?.success_message || 'Invitation sent successfully',
            activeCustomerFound: this.bulkInviteAppSettings?.success_message_customer_found,
            customerNotFound: this.bulkInviteAppSettings?.error_message,
            serverError: 'Something went wrong. Unable to fetch your data. Please enter your password to continue.',
            timeoutError: 'Request timed out. Unable to fetch your data. Please enter your password to continue.',
            formNotFound: 'Login form not found. The helper may not work correctly.',
            shopifyNotFound: 'Shopify object not found. Some features may not work.',
            passwordFieldNotFound: 'Password field not found',
            emailFieldNotFound: 'Email field not found'
        };

        // API endpoint
        this.apiEndpoint = 'https://bulk-invites.upsolite.com/api/invite';
        this.apiToken = this.bulkInviteAppSettings?.api_token;

        if (!this.apiToken) {
            return;
        }

        // API timeout in milliseconds
        this.apiTimeout = 10000;

        this.onLoad();
    }

    onLoad() {
        try {
            // Check if Shopify object exists
            if (typeof Shopify === 'undefined') {
                console.warn(this.messages.shopifyNotFound);
            }

            // Check if required elements are found
            if (!this.targetElements["login-form"]) {
                console.warn(this.messages.formNotFound);
            }

            this.hidePasswordField();
            this.disableSubmitBtn();
            this.setupEmailFieldListener();
            this.setupFormSubmissionHandler();
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }

    /**
     * Hides the password field and its parent container
     */
    hidePasswordField() {
        try {
            const passwordField = this.targetElements["passwordField"];
            if (!passwordField) {
                console.warn(this.messages.passwordFieldNotFound);
                return;
            }

            // Hide the password field itself
            passwordField.style.display = "none";

            // Try to find and hide parent containers
            this.hidePasswordFieldContainer(passwordField);
        } catch (error) {
            console.error('Error hiding password field:', error);
        }
    }

    /**
     * Shows the password field and its parent container
     */
    showPasswordField() {
        try {
            const passwordField = this.targetElements["passwordField"];
            if (!passwordField) {
                console.warn('Password field not found');
                return;
            }

            // Show the password field itself
            passwordField.style.display = "block";

            // Try to find and show parent containers
            this.showPasswordFieldContainer(passwordField);
        } catch (error) {
            console.error('Error showing password field:', error);
        }
    }

    /**
     * Finds and hides the parent container of the password field
     * @param {HTMLElement} passwordField - The password input element
     */
    hidePasswordFieldContainer(passwordField) {
        try {
            // Find parent container by common classes
            let parent = this.findParentWithClasses(passwordField,
                [...this.formContainerClasses, ...this.passwordContainerClasses]);

            if (parent) {
                parent.style.display = 'none';
                return;
            }

            // If no parent with matching classes, try direct parent div
            parent = passwordField.closest('div');
            if (parent) {
                parent.style.display = 'none';
            }
        } catch (error) {
            console.error('Error hiding password field container:', error);
        }
    }

    /**
     * Finds and shows the parent container of the password field
     * @param {HTMLElement} passwordField - The password input element
     */
    showPasswordFieldContainer(passwordField) {
        try {
            // Find parent container by common classes
            let parent = this.findParentWithClasses(passwordField,
                [...this.formContainerClasses, ...this.passwordContainerClasses]);

            if (parent) {
                parent.style.display = '';
                return;
            }

            // If no parent with matching classes, try direct parent div
            parent = passwordField.closest('div');
            if (parent) {
                parent.style.display = '';
            }
        } catch (error) {
            console.error('Error showing password field container:', error);
        }
    }

    /**
     * Helper function to find a parent element that has one of the specified classes
     * @param {HTMLElement} element - The starting element
     * @param {Array} classes - Array of class names to look for
     * @returns {HTMLElement|null} The found parent element or null
     */
    findParentWithClasses(element, classes) {
        try {
            let current = element;
            while (current && current !== document.body) {
                // Check if current element has any of the target classes
                for (const className of classes) {
                    if (current.classList && current.classList.contains(className)) {
                        return current;
                    }
                }
                current = current.parentElement;
            }
            return null;
        } catch (error) {
            console.error('Error finding parent with classes:', error);
            return null;
        }
    }

    disableSubmitBtn() {
        try {
            if (this.targetElements["submitBtn"]) {
                this.targetElements["submitBtn"].disabled = true;
            }
        } catch (error) {
            console.error('Error disabling submit button:', error);
        }
    }

    enableSubmitBtn() {
        try {
            if (this.targetElements["submitBtn"]) {
                this.targetElements["submitBtn"].disabled = false;
            }
        } catch (error) {
            console.error('Error enabling submit button:', error);
        }
    }

    /**
     * Sets up event listeners for the email field
     */
    setupEmailFieldListener() {
        try {
            const emailField = this.targetElements["emailField"];
            if (!emailField) {
                console.warn('Email field not found');
                return;
            }

            // Debounce function to improve performance
            const debounce = (fn, delay) => {
                let timeoutId;
                return function(...args) {
                    clearTimeout(timeoutId);
                    timeoutId = setTimeout(() => fn.apply(this, args), delay);
                };
            };

            // Debounced handler for input events
            const handleInput = debounce((event) => {
                // Enable/disable submit button based on content
                if (event.target.value.trim() !== '') {
                    this.enableSubmitBtn();
                } else {
                    this.disableSubmitBtn();
                }

                // Clear any existing message when user types
                this.clearInvitationMessage();
            }, 100);

            // Listen for input events on the email field
            emailField.addEventListener('input', handleInput);

            // Also check on focus/blur for better user experience
            emailField.addEventListener('focus', (event) => {
                if (event.target.value.trim() !== '') {
                    this.enableSubmitBtn();
                }
            });

            emailField.addEventListener('blur', (event) => {
                if (event.target.value.trim() === '') {
                    this.disableSubmitBtn();
                }
            });
        } catch (error) {
            console.error('Error setting up email field listener:', error);
        }
    }

    /**
     * Clears any displayed invitation message
     */
    clearInvitationMessage() {
        try {
            const messageEl = document.querySelector('.invite-message');
            if (messageEl) {
                messageEl.remove();
            }
        } catch (error) {
            console.error('Error clearing invitation message:', error);
        }
    }

    /**
     * Sets up the form submission handler
     */
    setupFormSubmissionHandler() {
        try {
            const loginForm = this.targetElements["login-form"];
            const submitBtn = this.targetElements["submitBtn"];

            if (!loginForm && !submitBtn) {
                console.warn('Login form or submit button not found');
                return;
            }

            // Handle form submission
            if (loginForm) {
                loginForm.addEventListener('submit', (event) => {
                    // Only prevent default if password field is hidden
                    const passwordField = this.targetElements["passwordField"];
                    if (!passwordField || passwordField.style.display === 'none') {
                        event.preventDefault();
                        event.stopImmediatePropagation();
                        event.stopPropagation();
                        this.handleFormSubmission(event);
                        return false;
                    }
                    // Otherwise let the form submit normally
                    return true;
                });
            }

            if (submitBtn) {
                submitBtn.addEventListener('click', (event) => {
                    // Only prevent default if password field is hidden
                    const passwordField = this.targetElements["passwordField"];
                    if (!passwordField || passwordField.style.display === 'none') {
                        event.preventDefault();
                        this.handleFormSubmission(event);
                        return false;
                    }
                    // Otherwise let the form submit normally
                    return true;
                });
            }
        } catch (error) {
            console.error('Error setting up form submission handler:', error);
        }
    }

    /**
     * Handles form submission logic
     * @param {Event} event - The submission event
     */
    handleFormSubmission(event) {
        try {
            const emailField = this.targetElements["emailField"];
            if (!emailField) {
                console.warn('Email field not found');
                return;
            }

            const email = emailField.value.trim();
            if (email === '') {
                return;
            }

            // Call the API to check user status
            this.checkUserStatus(email);
        } catch (error) {
            console.error('Error handling form submission:', error);
        }
    }

    /**
     * Creates a nonce for API authentication
     * @returns {String} The generated nonce
     */
    createNonce() {
        try {
            let text = btoa(navigator.userAgent) + '-' + Shopify.shop;
            let key = Math.floor(Date.now() / 1000);

            key = key.toString();
            let encrypted = '';
            for (let i = 0; i < text.length; i++) {
                encrypted += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            return btoa(encrypted);
        } catch (error) {
            console.error('Error creating nonce:', error);
            return '';
        }
    }

    /**
     * Checks the user status by calling the API
     * @param {String} email - The user's email
     */
    checkUserStatus(email) {
        try {
            // Disable the button while API call is in progress
            this.disableSubmitBtn();

            // Create a AbortController for timeout handling
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.apiTimeout);

            fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'X-Api-Token': this.apiToken,
                    'X-Nonce': this.createNonce(),
                },
                body: JSON.stringify({ email: email }),
                signal: controller.signal
            })
                .then((response) => {
                    // Clear timeout since we got a response
                    clearTimeout(timeoutId);

                    // Get status code and parse JSON
                    const statusCode = response.status;
                    return response.json().then(data => ({
                        statusCode,
                        data
                    }))
                        .catch(error => {
                            // JSON parsing error
                            console.error('Error parsing API response:', error);
                            return { statusCode, data: { error: 'Invalid response format' } };
                        });
                })
                .then((result) => {
                    console.log('API Response:', result);

                    const { statusCode, data } = result;

                    // Handle different status codes
                    switch(statusCode) {
                        case 200:
                            // Check the state from the response
                            if (data.state === 'INVITED' || data.invited === true) {
                                // Invitation sent successfully
                                this.showInvitationMessage(this.messages.invitationSent, 'success');
                            } else if (data.state === 'ENABLED') {
                                // User is enabled, show password field
                                if (this.messages.activeCustomerFound) {
                                    this.showInvitationMessage(this.messages.activeCustomerFound, 'success');
                                }
                                this.showPasswordField();
                                // Focus the password field
                                if (this.targetElements["passwordField"]) {
                                    this.targetElements["passwordField"].focus();
                                }
                            }
                            break;

                        case 302:
                            // Customer found, show password field
                            this.showPasswordField();
                            // Focus the password field
                            if (this.targetElements["passwordField"]) {
                                this.targetElements["passwordField"].focus();
                            }
                            break;

                        case 401:
                            // Authentication Error
                            this.showPasswordField();
                            if (this.targetElements["passwordField"]) {
                                this.targetElements["passwordField"].focus();
                            }
                            break;

                        case 404:
                            // Customer not found - display as error
                            if (this.messages.customerNotFound) {
                                this.showInvitationMessage(
                                    this.messages.customerNotFound,
                                    'error'
                                );
                            }
                            break;

                        default:
                            // Handle any other status codes - Show info message and password field
                            console.warn(`Unexpected status code: ${statusCode}`);
                            this.showInvitationMessage(this.messages.serverError, 'error');
                            this.showPasswordField();
                            if (this.targetElements["passwordField"]) {
                                this.targetElements["passwordField"].focus();
                            }
                    }

                    // Re-enable the button
                    this.enableSubmitBtn();
                })
                .catch((error) => {
                    // Clear timeout in case of error
                    clearTimeout(timeoutId);

                    if (error.name === 'AbortError') {
                        console.error('API call timed out');
                        // Show timeout message and password field
                        this.showInvitationMessage(this.messages.timeoutError, 'error');
                    } else {
                        console.error('API call failed:', error);
                        // Show general error message
                        this.showInvitationMessage(this.messages.serverError, 'error');
                    }

                    // Show password field as fallback for any API failure
                    this.showPasswordField();
                    if (this.targetElements["passwordField"]) {
                        this.targetElements["passwordField"].focus();
                    }

                    // Re-enable the button
                    this.enableSubmitBtn();
                });
        } catch (error) {
            console.error('Error checking user status:', error);

            // Show error message
            this.showInvitationMessage(this.messages.serverError, 'error');

            // Show password field as fallback for any error
            this.showPasswordField();
            if (this.targetElements["passwordField"]) {
                this.targetElements["passwordField"].focus();
            }

            this.enableSubmitBtn();
        }
    }

    /**
     * Shows an invitation message at the beginning of the form
     * @param {String} message - The message to display
     * @param {String} type - The message type ('info', 'error', 'success')
     */
    showInvitationMessage(message, type = 'info') {
        try {
            // Find the form or a suitable container
            const form = this.targetElements["login-form"];
            if (!form) {
                console.warn('Form not found for showing message');
                return;
            }

            // Create or find a message element
            let messageEl = document.querySelector('.invite-message');
            if (!messageEl) {
                messageEl = document.createElement('div');
                messageEl.className = 'invite-message';

                // Insert at beginning of form
                form.insertBefore(messageEl, form.firstChild);
            }

            // Update message content
            messageEl.textContent = message;

            // Base styles for all message types
            const baseStyles = {
                padding: '10px',
                marginBottom: '15px',
                borderRadius: '4px',
                lineHeight: '1.5',
                textAlign: 'center',
            };

            // Type-specific styles
            const typeStyles = {
                'info': {
                    backgroundColor: '#e6f7ff',
                    border: '1px solid #91d5ff',
                    color: '#0050b3',
                    fontSize: '14px',
                    fontWeight: '500'
                },
                'error': {
                    backgroundColor: '#fff2f0',
                    border: '1px solid #ffccc7',
                    color: this.bulkInviteAppSettings?.error_font_color || '#cf1322',
                    fontSize: this.bulkInviteAppSettings?.error_font_size || '14px',
                    fontWeight: this.bulkInviteAppSettings?.error_font_weight || '500'
                },
                'success': {
                    backgroundColor: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    color: this.bulkInviteAppSettings?.success_font_color || '#52c41a',
                    fontSize: this.bulkInviteAppSettings?.success_font_size || '14px',
                    fontWeight: this.bulkInviteAppSettings?.success_font_weight || '500'
                }
            };

            // Apply combined styles
            Object.assign(messageEl.style, baseStyles, typeStyles[type] || typeStyles['info']);
        } catch (error) {
            console.error('Error showing invitation message:', error);
        }
    }
}

// Make the class available globally
window.ShopifyLoginHelper = ShopifyLoginHelper;

// Create an instance of the class
const smartLoginInvite = new ShopifyLoginHelper();
