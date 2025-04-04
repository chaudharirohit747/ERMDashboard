import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface UserSettings {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    newEmployee: boolean;
    employeeLeaves: boolean;
    departmentChanges: boolean;
    reportGeneration: boolean;
  };
  theme: {
    theme: string;
    primaryColor: string;
    animations: boolean;
  };
  security: {
    twoFactorAuth: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly SETTINGS_KEY = 'user_settings';

  constructor() { }

  saveSettings(settings: Partial<UserSettings>): Observable<boolean> {
    // Get existing settings
    const existingSettings = this.getStoredSettings();
    
    // Merge new settings with existing ones
    const updatedSettings = {
      ...existingSettings,
      ...settings,
      // Merge nested objects
      profile: { ...existingSettings.profile, ...settings.profile },
      notifications: { ...existingSettings.notifications, ...settings.notifications },
      theme: { ...existingSettings.theme, ...settings.theme },
      security: { ...existingSettings.security, ...settings.security }
    };

    // Save to localStorage
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updatedSettings));

    // Simulate API call
    return of(true).pipe(delay(500));
  }

  loadSettings(): Observable<UserSettings> {
    const settings = this.getStoredSettings();
    // Simulate API call
    return of(settings).pipe(delay(500));
  }

  private getStoredSettings(): UserSettings {
    const defaultSettings: UserSettings = {
      profile: {
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
      },
      notifications: {
        emailNotifications: true,
        pushNotifications: false,
        smsNotifications: false,
        newEmployee: true,
        employeeLeaves: true,
        departmentChanges: true,
        reportGeneration: false
      },
      theme: {
        theme: 'light',
        primaryColor: 'indigo',
        animations: true
      },
      security: {
        twoFactorAuth: false
      }
    };

    const storedSettings = localStorage.getItem(this.SETTINGS_KEY);
    if (!storedSettings) {
      return defaultSettings;
    }

    try {
      return JSON.parse(storedSettings);
    } catch {
      return defaultSettings;
    }
  }
}
