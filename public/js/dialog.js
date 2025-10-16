/**
 * Custom Dialog Component
 * Replaces browser default alert(), confirm(), and prompt()
 */

export class Dialog {
  /**
   * Show a confirmation dialog
   * @param {string} message - The message to display
   * @param {object} options - Dialog options
   * @returns {Promise<boolean>} - True if confirmed, false if cancelled
   */
  static confirm(message, options = {}) {
    return new Promise((resolve) => {
      const {
        title = 'Confirm',
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        confirmClass = 'btn-dark',
        cancelClass = 'btn-outline-secondary'
      } = options;

      // Create dialog HTML
      const dialogId = 'dialog-' + Date.now();
      const dialogHTML = `
        <div class="modal fade" id="${dialogId}" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header border-0 pb-0">
                <h5 class="modal-title">${title}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <p class="mb-0">${message}</p>
              </div>
              <div class="modal-footer border-0">
                <button type="button" class="btn ${cancelClass}" data-action="cancel">${cancelText}</button>
                <button type="button" class="btn ${confirmClass}" data-action="confirm">${confirmText}</button>
              </div>
            </div>
          </div>
        </div>
      `;

      // Add dialog to DOM
      document.body.insertAdjacentHTML('beforeend', dialogHTML);
      const dialogElement = document.getElementById(dialogId);
      const modal = new bootstrap.Modal(dialogElement);

      // Handle button clicks
      const handleAction = (confirmed) => {
        modal.hide();
        resolve(confirmed);
      };

      dialogElement.querySelector('[data-action="confirm"]').addEventListener('click', () => handleAction(true));
      dialogElement.querySelector('[data-action="cancel"]').addEventListener('click', () => handleAction(false));
      dialogElement.querySelector('.btn-close').addEventListener('click', () => handleAction(false));

      // Clean up after modal is hidden
      dialogElement.addEventListener('hidden.bs.modal', () => {
        dialogElement.remove();
      });

      // Show modal
      modal.show();
    });
  }

  /**
   * Show an alert dialog
   * @param {string} message - The message to display
   * @param {object} options - Dialog options
   * @returns {Promise<void>}
   */
  static alert(message, options = {}) {
    return new Promise((resolve) => {
      const {
        title = 'Alert',
        buttonText = 'OK',
        buttonClass = 'btn-dark'
      } = options;

      // Create dialog HTML
      const dialogId = 'dialog-' + Date.now();
      const dialogHTML = `
        <div class="modal fade" id="${dialogId}" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header border-0 pb-0">
                <h5 class="modal-title">${title}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <p class="mb-0">${message}</p>
              </div>
              <div class="modal-footer border-0">
                <button type="button" class="btn ${buttonClass}" data-bs-dismiss="modal">${buttonText}</button>
              </div>
            </div>
          </div>
        </div>
      `;

      // Add dialog to DOM
      document.body.insertAdjacentHTML('beforeend', dialogHTML);
      const dialogElement = document.getElementById(dialogId);
      const modal = new bootstrap.Modal(dialogElement);

      // Clean up after modal is hidden
      dialogElement.addEventListener('hidden.bs.modal', () => {
        dialogElement.remove();
        resolve();
      });

      // Show modal
      modal.show();
    });
  }

  /**
   * Show a prompt dialog
   * @param {string} message - The message to display
   * @param {object} options - Dialog options
   * @returns {Promise<string|null>} - The input value or null if cancelled
   */
  static prompt(message, options = {}) {
    return new Promise((resolve) => {
      const {
        title = 'Input',
        defaultValue = '',
        placeholder = '',
        confirmText = 'OK',
        cancelText = 'Cancel',
        confirmClass = 'btn-dark',
        cancelClass = 'btn-outline-secondary'
      } = options;

      // Create dialog HTML
      const dialogId = 'dialog-' + Date.now();
      const inputId = 'input-' + Date.now();
      const dialogHTML = `
        <div class="modal fade" id="${dialogId}" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header border-0 pb-0">
                <h5 class="modal-title">${title}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <p class="mb-3">${message}</p>
                <input type="text" class="form-control" id="${inputId}"
                       value="${defaultValue}" placeholder="${placeholder}">
              </div>
              <div class="modal-footer border-0">
                <button type="button" class="btn ${cancelClass}" data-action="cancel">${cancelText}</button>
                <button type="button" class="btn ${confirmClass}" data-action="confirm">${confirmText}</button>
              </div>
            </div>
          </div>
        </div>
      `;

      // Add dialog to DOM
      document.body.insertAdjacentHTML('beforeend', dialogHTML);
      const dialogElement = document.getElementById(dialogId);
      const inputElement = document.getElementById(inputId);
      const modal = new bootstrap.Modal(dialogElement);

      // Handle button clicks
      const handleAction = (confirmed) => {
        const value = confirmed ? inputElement.value : null;
        modal.hide();
        resolve(value);
      };

      dialogElement.querySelector('[data-action="confirm"]').addEventListener('click', () => handleAction(true));
      dialogElement.querySelector('[data-action="cancel"]').addEventListener('click', () => handleAction(false));
      dialogElement.querySelector('.btn-close').addEventListener('click', () => handleAction(false));

      // Handle Enter key
      inputElement.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          handleAction(true);
        }
      });

      // Clean up after modal is hidden
      dialogElement.addEventListener('hidden.bs.modal', () => {
        dialogElement.remove();
      });

      // Show modal and focus input
      modal.show();
      dialogElement.addEventListener('shown.bs.modal', () => {
        inputElement.focus();
        inputElement.select();
      });
    });
  }
}

// Make it globally available
window.Dialog = Dialog;
