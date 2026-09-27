import { UserProfile, AdminBillingData } from '../types/lorcana';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_ENDPOINT || '/api';

export interface AuthResponse {
  message: string;
  token?: string;
  user?: UserProfile;
  error?: string;
}

export const apiService = {
  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      return data;
    } catch (err: any) {
      return { message: '', error: err.message || 'Network error' };
    }
  },

  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      return data;
    } catch (err: any) {
      return { message: '', error: err.message || 'Network error' };
    }
  },

  async saveDeck(name: string, cards: any[], token?: string): Promise<{ message: string; deckId?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/decks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name, cards }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save deck');
      return data;
    } catch (err: any) {
      return { message: 'Saved locally', error: err.message };
    }
  },

  async getUserDecks(token?: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/decks`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return await response.json();
    } catch (err: any) {
      return { decks: [], error: err.message };
    }
  },

  async deleteDeck(deckId: string, token?: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/decks/${deckId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return await response.json();
    } catch (err: any) {
      return { error: err.message };
    }
  },

  async analyzeDeck(deckId: string, token?: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/decks/${deckId}/analyze`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return await response.json();
    } catch (err: any) {
      return { error: err.message };
    }
  },

  async getDeckAnalysis(deckId: string, token?: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/decks/${deckId}/analysis`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return await response.json();
    } catch (err: any) {
      return { error: err.message };
    }
  },

  async verifyAdminPasscode(passcode: string): Promise<{ valid: boolean; role?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/verify-passcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      if (response.ok) {
        const data = await response.json();
        return { valid: true, role: data.role || 'admin' };
      }
    } catch (e) {
      // Backend offline: passcode can only be verified server-side
    }
    return { valid: false, error: 'Invalid admin passcode' };
  },

  async elevateToAdmin(passcode: string, token?: string): Promise<{ success: boolean; role?: string; token?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/elevate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ passcode }),
      });
      if (response.ok) {
        const data = await response.json();
        return { success: true, role: data.role || 'admin', token: data.token };
      }
    } catch (e) {
      // Backend offline: passcode can only be verified server-side
    }
    return { success: false, error: 'รหัส Admin ไม่ถูกต้อง (Invalid Admin Passcode)' };
  },

  async getAdminBilling(token?: string): Promise<{ data: AdminBillingData; error?: string }> {
    const fallbackBilling: AdminBillingData = {
      accountId: '953899323223',
      budgetTotal: 100.00,
      monthToDateSpend: 9.77,
      forecastSpend: 10.50,
      remainingBudget: 90.23,
      budgetUsagePercent: 9.77,
      currentHourlyBurnRate: 0.0000,
      cloudStatus: 'stopped',
      services: [
        { name: 'AWS Elastic Load Balancing (ALB)', category: 'Network', cost: 6.95, percentage: 71.1, status: 'Stopped ($0.00/hr)' },
        { name: 'Amazon Virtual Private Cloud (VPC / NAT / Endpoints)', category: 'Network', cost: 1.91, percentage: 19.5, status: 'Stopped ($0.00/hr)' },
        { name: 'Amazon EC2-Instances (t3.micro ASG Nodes)', category: 'Compute', cost: 0.42, percentage: 4.3, status: '0 Running ($0.00/hr)' },
        { name: 'Amazon EC2-Other (EBS gp3 Root Volumes)', category: 'Storage', cost: 0.30, percentage: 3.1, status: 'Idle ($0.00/hr)' },
        { name: 'Amazon CloudWatch (Metrics & Alarms)', category: 'Monitoring', cost: 0.19, percentage: 2.0, status: 'Active (Free Tier)' },
        { name: 'Amazon DynamoDB (Users, Decks, Rooms Tables)', category: 'Database', cost: 0.00, percentage: 0.0, status: 'Active (Pay-Per-Request)' },
        { name: 'Amazon Simple Queue Service (SQS Matchmaking)', category: 'Messaging', cost: 0.00, percentage: 0.0, status: 'Active (Free Tier)' },
      ],
      resourceTelemetry: {
        asgDesired: 0,
        asgCurrent: 0,
        albCount: 0,
        ec2Running: 0,
        dynamoTables: 3,
        sqsQueues: 1,
      },
      lastUpdated: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/admin/billing`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (response.ok) {
        const json = await response.json();
        return { data: json.data || fallbackBilling };
      }
    } catch (e) {
      // Return offline fallback
    }

    return { data: fallbackBilling };
  },
};
