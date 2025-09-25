export class AuthService {
  constructor() {
    this.baseUrl = '/api';
    this.token = localStorage.getItem('authToken');
    this.user = null;
    this.loadUser();
  }

  async loadUser() {
    if (this.token) {
      try {
        const response = await this.makeRequest('/auth/me', 'GET');
        if (response.user) {
          this.user = response.user;
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        this.clearAuth();
      }
    }
  }

  async makeRequest(endpoint, method = 'GET', body = null) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const options = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok && response.status === 401) {
      this.clearAuth();
      window.location.href = '/login.html';
    }

    return data;
  }

  async register(email, password, firstName, lastName, phone) {
    const response = await this.makeRequest('/auth/register', 'POST', {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      phone
    });

    // Don't set auth immediately for registration - user needs to verify email first
    // Only set auth for login, not registration

    return response;
  }

  async login(email, password) {
    const response = await this.makeRequest('/auth/login', 'POST', {
      email,
      password
    });

    if (response.success && response.token) {
      this.setAuth(response.token, response.user);
    }

    return response;
  }

  async logout() {
    const response = await this.makeRequest('/auth/logout', 'POST');
    this.clearAuth();
    return response;
  }

  async verifyEmail(token, otp) {
    const response = await this.makeRequest('/auth/verify-email', 'POST', {
      token,
      otp
    });

    if (response.success && response.token) {
      this.setAuth(response.token, response.user);
    }

    return response;
  }

  async initiatePasswordReset(email) {
    return await this.makeRequest('/auth/forgot-password', 'POST', {
      email
    });
  }

  async resetPassword(password) {
    return await this.makeRequest('/auth/reset-password', 'POST', {
      password
    });
  }

  async resendVerificationEmail(email) {
    return await this.makeRequest('/auth/resend-verification', 'POST', {
      email
    });
  }

  async updateProfile(updates) {
    const response = await this.makeRequest('/auth/me', 'PUT', updates);
    
    if (response.success) {
      this.user = response.user;
    }

    return response;
  }

  setAuth(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  clearAuth() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  getUser() {
    return this.user;
  }

  getToken() {
    return this.token;
  }
}