import { Injectable } from '@angular/core';

export class ApiError<T = unknown> extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data?: T
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:5275/api';

  async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || errorData?.error || this.getDefaultErrorMessage(response.status);
        throw new ApiError(errorMessage, response.status, errorData);
      }

      return response.json();
    } catch (error: any) {
      if (error instanceof Error && error.message !== 'Failed to fetch') {
        throw error;
      }
      throw new Error('Unable to connect to the server. Please check your connection and try again.');
    }
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || errorData?.error || this.getDefaultErrorMessage(response.status);
        throw new ApiError(errorMessage, response.status, errorData);
      }

      return response.json();
    } catch (error: any) {
      if (error instanceof Error && error.message !== 'Failed to fetch') {
        throw error;
      }
      throw new Error('Unable to connect to the server. Please check your connection and try again.');
    }
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || errorData?.error || this.getDefaultErrorMessage(response.status);
        throw new ApiError(errorMessage, response.status, errorData);
      }

      return response.json();
    } catch (error: any) {
      if (error instanceof Error && error.message !== 'Failed to fetch') {
        throw error;
      }
      throw new Error('Unable to connect to the server. Please check your connection and try again.');
    }
  }

  async delete(endpoint: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || errorData?.error || this.getDefaultErrorMessage(response.status);
        throw new ApiError(errorMessage, response.status, errorData);
      }
    } catch (error: any) {
      if (error instanceof Error && error.message !== 'Failed to fetch') {
        throw error;
      }
      throw new Error('Unable to connect to the server. Please check your connection and try again.');
    }
  }

  private getDefaultErrorMessage(status: number): string {
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Incorrect email or password.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This resource already exists.';
      case 429:
        return 'Too many requests to the AI service. Please wait a minute and try again.';
      case 500:
        return 'A server error occurred. Please try again later.';
      case 503:
        return 'Service is temporarily unavailable. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}
